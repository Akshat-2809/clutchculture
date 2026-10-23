import { Router } from "express";
import { z } from "zod";
import { isProd } from "../config/env.js";
import { sql } from "../db/client.js";
import { badRequest, forbidden, notFound } from "../lib/httpError.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { checkoutLimiter } from "../middleware/rateLimit.js";
import { createOrder, markFailed, markPaid } from "../services/orders.js";
import {
  razorpayEnabled,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../services/razorpay.js";

export const ordersRouter = Router();

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

const createOrderBody = z.object({
  items: z
    .array(z.object({ slug: z.string().min(1), qty: z.number().int().min(1).max(10) }))
    .min(1, "Your garage is empty")
    .max(50),
  email: z.email(),
  phone,
  address: z.object({
    fullName: z.string().trim().min(2),
    line1: z.string().trim().min(3),
    line2: z.string().trim().optional(),
    landmark: z.string().trim().optional(),
    city: z.string().trim().min(2),
    state: z.string().trim().min(2),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/),
  }),
});

ordersRouter.post("/orders", checkoutLimiter, optionalAuth, async (req, res) => {
  const body = createOrderBody.parse(req.body);
  const order = await createOrder({
    items: body.items,
    email: body.email,
    phone: body.phone,
    address: { ...body.address, phone: body.phone, country: "IN" },
    userId: req.user?.id,
  });
  res.status(201).json(order);
});

/** Signed-in customer's own orders. */
ordersRouter.get("/orders", requireAuth, async (req, res) => {
  const rows = await sql`
    select id, order_number as "orderNumber", status, payment_status as "paymentStatus", total,
      created_at as "createdAt"
    from orders where user_id = ${req.user!.id} order by created_at desc
  `;
  res.json(rows);
});

// ---------- Payments ----------

async function findOrder(orderNumber: string) {
  const [o] = await sql<{ id: string; orderNumber: string; total: number }[]>`
    select id, order_number as "orderNumber", total from orders where order_number = ${orderNumber}
  `;
  if (!o) throw notFound("Order not found");
  return o;
}

const verifyBody = z.object({
  orderNumber: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/** Razorpay Checkout success callback. The webhook confirms the same payment too. */
ordersRouter.post("/payments/verify", checkoutLimiter, async (req, res) => {
  const b = verifyBody.parse(req.body);
  if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    throw badRequest("Payment could not be verified");
  }
  const order = await findOrder(b.orderNumber);
  const [payment] = await sql`
    select 1 from payments where order_id = ${order.id} and razorpay_order_id = ${b.razorpay_order_id}
  `;
  if (!payment) throw badRequest("Payment does not match this order");
  const result = await markPaid(order.id, {
    razorpayOrderId: b.razorpay_order_id,
    razorpayPaymentId: b.razorpay_payment_id,
  });
  res.json(result);
});

/** Customer closed or failed the Razorpay popup: free the held stock right away. */
// Order numbers are guessable, so the Razorpay order id (only the buyer has it)
// is required as proof.
ordersRouter.post("/payments/failed", checkoutLimiter, async (req, res) => {
  const { orderNumber, razorpay_order_id } = z
    .object({ orderNumber: z.string(), razorpay_order_id: z.string() })
    .parse(req.body);
  const order = await findOrder(orderNumber);
  const [payment] = await sql`
    select 1 from payments where order_id = ${order.id} and razorpay_order_id = ${razorpay_order_id}
  `;
  if (!payment) throw badRequest("Payment does not match this order");
  await markFailed(order.id, "Payment cancelled or failed at checkout");
  res.json({ ok: true });
});

/**
 * Development only, while Razorpay keys aren't set: pretend the payment
 * succeeded so the whole order → stock flow can be tested. Refused in production
 * and as soon as Razorpay is configured.
 */
ordersRouter.post("/payments/test-confirm", checkoutLimiter, async (req, res) => {
  if (isProd || razorpayEnabled) throw forbidden("Test payments are disabled");
  const { orderNumber } = z.object({ orderNumber: z.string() }).parse(req.body);
  const order = await findOrder(orderNumber);
  res.json(await markPaid(order.id, { method: "test" }));
});

/** Razorpay → server. Source of truth; raw body (see app.ts) for the signature. */
ordersRouter.post("/payments/webhook", async (req, res) => {
  const signature = req.header("x-razorpay-signature") ?? "";
  if (!Buffer.isBuffer(req.body) || !verifyWebhookSignature(req.body, signature)) {
    throw badRequest("Invalid signature");
  }
  const event = JSON.parse(req.body.toString("utf8"));
  const eventId = req.header("x-razorpay-event-id") ?? `${event.event}:${event.created_at}`;

  // Idempotency: a redelivered event hits the primary key and is skipped.
  const inserted = await sql`
    insert into webhook_events (id, type, payload) values (${eventId}, ${event.event}, ${JSON.stringify(event)}::jsonb)
    on conflict (id) do nothing returning id
  `;
  if (!inserted.length) {
    res.json({ ok: true, duplicate: true });
    return;
  }

  const payment = event.payload?.payment?.entity;
  if (payment?.order_id) {
    const [row] = await sql<{ orderId: string }[]>`
      select order_id as "orderId" from payments where razorpay_order_id = ${payment.order_id}
    `;
    if (row && event.event === "payment.captured") {
      await markPaid(row.orderId, {
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        method: payment.method,
        raw: payment,
      });
    } else if (row && event.event === "payment.failed") {
      await markFailed(row.orderId);
    }
  }
  await sql`update webhook_events set processed_at = now() where id = ${eventId}`;
  res.json({ ok: true });
});
