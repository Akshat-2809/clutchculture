import type { ShippingAddress } from "../db/schema.js";
import { sql } from "../db/client.js";
import { badRequest, conflict, notFound } from "../lib/httpError.js";
import { ACTIVE, selectProducts } from "./catalog.js";
import * as inventory from "./inventory.js";
import type { StockLine } from "./inventory.js";
import { createRazorpayOrder, razorpayEnabled } from "./razorpay.js";

/** Unpaid orders hold stock this long before it's released. */
export const RESERVATION_MINUTES = 15;

type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed"
  | "refunded";

type OrderHead = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  total: number;
};

async function orderLines(tx: typeof sql | inventory.Tx, orderId: string) {
  return tx<StockLine[]>`
    select variant_id as "variantId", qty, product_name as "name"
    from order_items where order_id = ${orderId} and variant_id is not null
  `;
}

async function lockOrder(tx: inventory.Tx, orderId: string) {
  const [o] = await tx<OrderHead[]>`
    select id, order_number as "orderNumber", status, payment_status as "paymentStatus", total
    from orders where id = ${orderId} for update
  `;
  if (!o) throw notFound("Order not found");
  return o;
}

async function addHistory(
  tx: inventory.Tx,
  orderId: string,
  from: OrderStatus | null,
  to: OrderStatus,
  note?: string,
  userId?: string,
) {
  await tx`
    insert into order_status_history (order_id, from_status, to_status, note, changed_by)
    values (${orderId}, ${from}, ${to}, ${note ?? null}, ${userId ?? null})
  `;
}

// ---------- Placing an order ----------

export type NewOrder = {
  items: { slug: string; qty: number }[];
  email: string;
  phone: string;
  address: ShippingAddress;
  userId?: string;
};

export async function createOrder(input: NewOrder) {
  // Merge duplicate lines.
  const qtyBySlug = new Map<string, number>();
  for (const { slug, qty } of input.items) qtyBySlug.set(slug, (qtyBySlug.get(slug) ?? 0) + qty);
  const slugs = [...qtyBySlug.keys()];

  // Prices always come from the database, never from the client.
  const products = await selectProducts(sql`${ACTIVE} and p.slug in ${sql(slugs)}`);
  const missing = slugs.filter((s) => !products.some((p) => p.slug === s));
  if (missing.length) throw badRequest("Some items are no longer available", { missing });

  const lines = products.map((p) => {
    if (!p.variantId || !p.sku) throw conflict(`"${p.name}" can't be ordered right now`);
    const qty = qtyBySlug.get(p.slug)!;
    if (qty > p.available) {
      throw conflict(
        p.available === 0
          ? `"${p.name}" is sold out`
          : `Only ${p.available} left of "${p.name}"`,
        { slug: p.slug, available: p.available },
      );
    }
    return { p, qty, lineTotal: p.price * qty };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  // Prices include GST (5% default); store the included tax for invoices.
  const tax = lines.reduce((s, l) => s + Math.round(l.lineTotal - (l.lineTotal * 100) / 105), 0);
  const shippingFee = 0; // TODO: shipping rules pending client decision
  const total = subtotal + shippingFee;

  const order = await sql.begin(async (tx) => {
    await inventory.reserve(
      tx,
      lines.map((l) => ({ variantId: l.p.variantId!, qty: l.qty, name: l.p.name })),
    );

    const [o] = await tx<[{ id: string; orderNumber: string }]>`
      insert into orders (user_id, email, phone, subtotal, shipping_fee, tax, total,
        shipping_address, reserved_until)
      values (${input.userId ?? null}, ${input.email}, ${input.phone}, ${subtotal}, ${shippingFee},
        ${tax}, ${total}, ${JSON.stringify(input.address)}::jsonb,
        now() + ${`${RESERVATION_MINUTES} minutes`}::interval)
      returning id, order_number as "orderNumber"
    `;
    for (const l of lines) {
      await tx`
        insert into order_items (order_id, variant_id, product_name, sku, size, unit_price, qty,
          gst_rate, line_total)
        values (${o.id}, ${l.p.variantId}, ${l.p.name}, ${l.p.sku}, 'Standard', ${l.p.price},
          ${l.qty}, 5, ${l.lineTotal})
      `;
    }
    await addHistory(tx, o.id, null, "pending_payment", "Order placed");
    return o;
  });

  let razorpay: { keyId: string; orderId: string; amount: number } | null = null;
  if (razorpayEnabled) {
    try {
      const rp = await createRazorpayOrder(total, order.orderNumber);
      await sql`
        insert into payments (order_id, razorpay_order_id, amount)
        values (${order.id}, ${rp.id}, ${total})
      `;
      razorpay = { keyId: process.env.RAZORPAY_KEY_ID!, orderId: rp.id, amount: total };
    } catch (err) {
      await markFailed(order.id, "Could not start payment");
      throw err;
    }
  }

  return { ...order, total, razorpay, testMode: !razorpayEnabled };
}

// ---------- Payment outcomes ----------

/** Idempotent: safe to call from both the checkout callback and the webhook. */
export async function markPaid(
  orderId: string,
  payment: { razorpayOrderId?: string; razorpayPaymentId?: string; method?: string; raw?: unknown },
) {
  return sql.begin(async (tx) => {
    const o = await lockOrder(tx, orderId);
    if (o.paymentStatus === "paid") return o;

    const lines = await orderLines(tx, orderId);
    let note = "Payment received";
    if (o.status === "pending_payment") {
      await inventory.commit(tx, lines, orderId);
    } else {
      // The hold had already expired or failed, so stock was released. Sell
      // from free stock if it's still there; otherwise flag for a refund.
      const ok = await inventory.deductIfAvailable(tx, lines, orderId);
      note = ok
        ? "Payment received after the stock hold expired; stock deducted"
        : "Payment received after the stock hold expired and items are no longer in stock — refund needed";
    }

    await tx`
      update orders set status = 'confirmed', payment_status = 'paid', reserved_until = null,
        notes = ${note === "Payment received" ? null : note}
      where id = ${orderId}
    `;
    await addHistory(tx, orderId, o.status, "confirmed", note);

    if (payment.razorpayOrderId) {
      await tx`
        update payments set status = 'captured',
          razorpay_payment_id = ${payment.razorpayPaymentId ?? null},
          method = ${payment.method ?? null}, raw = ${payment.raw ? JSON.stringify(payment.raw) : null}::jsonb
        where razorpay_order_id = ${payment.razorpayOrderId}
      `;
    }
    return { ...o, status: "confirmed" as const, paymentStatus: "paid" };
  });
}

export async function markFailed(orderId: string, note = "Payment failed") {
  await sql.begin(async (tx) => {
    const o = await lockOrder(tx, orderId);
    if (o.status !== "pending_payment") return;
    await inventory.release(tx, await orderLines(tx, orderId));
    await tx`
      update orders set status = 'payment_failed', payment_status = 'failed', reserved_until = null
      where id = ${orderId}
    `;
    await addHistory(tx, orderId, o.status, "payment_failed", note);
  });
}

/** Release stock held by orders that weren't paid in time. Runs every minute. */
export async function expireReservations() {
  const expired = await sql<{ id: string }[]>`
    select id from orders where status = 'pending_payment' and reserved_until < now()
  `;
  for (const { id } of expired) {
    await sql.begin(async (tx) => {
      const o = await lockOrder(tx, id);
      if (o.status !== "pending_payment") return;
      await inventory.release(tx, await orderLines(tx, id));
      await tx`
        update orders set status = 'cancelled', payment_status = 'failed', reserved_until = null
        where id = ${id}
      `;
      await addHistory(tx, id, o.status, "cancelled", "Payment not completed in time; stock released");
    });
  }
  return expired.length;
}

// ---------- Admin status changes ----------

const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_payment: ["cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

export function nextStatuses(status: OrderStatus) {
  return TRANSITIONS[status] ?? [];
}

export async function setOrderStatus(
  orderId: string,
  to: OrderStatus,
  opts: { userId?: string; trackingNumber?: string; courier?: string; note?: string } = {},
) {
  return sql.begin(async (tx) => {
    const o = await lockOrder(tx, orderId);
    if (!nextStatuses(o.status).includes(to)) {
      throw badRequest(`Can't change an order from ${o.status} to ${to}`);
    }

    let note = opts.note;
    if (to === "cancelled") {
      const lines = await orderLines(tx, orderId);
      if (o.status === "pending_payment") {
        await inventory.release(tx, lines);
      } else {
        await inventory.restock(tx, lines, orderId);
        // TODO(Phase 4): trigger the refund through the Razorpay API.
        note ??= "Cancelled by admin; items restocked. Refund the payment from Razorpay.";
      }
    }

    await tx`
      update orders set status = ${to},
        tracking_number = coalesce(${opts.trackingNumber ?? null}, tracking_number),
        courier = coalesce(${opts.courier ?? null}, courier),
        reserved_until = null
      where id = ${orderId}
    `;
    await addHistory(tx, orderId, o.status, to, note, opts.userId);
    return { ...o, status: to };
  });
}
