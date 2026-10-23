import { Router } from "express";
import { z } from "zod";
import { sql } from "../../db/client.js";
import { badRequest, notFound } from "../../lib/httpError.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { nextStatuses, setOrderStatus } from "../../services/orders.js";
import { adminProductsRouter } from "./products.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.use(adminProductsRouter);

const PAID = sql`o.payment_status = 'paid'`;
const AVAILABLE = sql`(coalesce(v.stock_qty, 0) - coalesce(v.reserved_qty, 0))`;

// ---------- Dashboard ----------

adminRouter.get("/stats", async (req, res) => {
  const { days } = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(req.query);
  const since = sql`now() - ${`${days} days`}::interval`;

  const [[stats], series, byStatus, recent, top, lowStock, topCustomers] = await Promise.all([
    sql`
      select
        coalesce((select sum(total) from orders o where ${PAID} and o.created_at >= ${since}), 0)::int as "periodRevenue",
        coalesce((select sum(total) from orders o where ${PAID}), 0)::int as "totalRevenue",
        (select count(*) from orders o where ${PAID} and o.created_at >= ${since})::int as "periodOrders",
        (select count(*) from orders where status in ('confirmed', 'processing'))::int as "toFulfil",
        (select count(*) from orders where status = 'pending_payment')::int as "awaitingPayment",
        (select count(*) from profiles where role = 'customer')::int as "customers",
        (select count(*) from products where status = 'active')::int as "activeProducts",
        (select count(*) from products p join lateral (select * from product_variants pv where pv.product_id = p.id order by pv.created_at limit 1) v on true
          where p.status = 'active' and ${AVAILABLE} <= v.low_stock_threshold)::int as "lowStockCount"
    `,
    sql`
      select to_char(d, 'YYYY-MM-DD') as date,
        coalesce(sum(o.total), 0)::int as revenue, count(o.id)::int as orders
      from generate_series((now() - ${`${days - 1} days`}::interval)::date, now()::date, '1 day') d
      left join orders o on o.created_at::date = d and ${PAID}
      group by d order by d
    `,
    sql`
      select status, count(*)::int as count from orders o where o.created_at >= ${since}
      group by status
    `,
    sql`
      select id, order_number as "orderNumber", shipping_address->>'fullName' as customer,
        total, status, created_at as "createdAt"
      from orders order by created_at desc limit 6
    `,
    sql`
      select oi.product_name as name, sum(oi.qty)::int as units, sum(oi.line_total)::int as revenue
      from order_items oi join orders o on o.id = oi.order_id
      where ${PAID} and o.created_at >= ${since}
      group by oi.product_name order by revenue desc limit 5
    `,
    sql`
      select p.id, p.name, ${AVAILABLE}::int as available,
        (select url from product_images i where i.product_id = p.id order by sort_order, created_at limit 1) as image
      from products p join lateral (select * from product_variants pv where pv.product_id = p.id order by pv.created_at limit 1) v on true
      where p.status = 'active' and ${AVAILABLE} <= v.low_stock_threshold
      order by ${AVAILABLE} asc limit 8
    `,
    sql`
      select shipping_address->>'fullName' as name, email, count(*)::int as orders, sum(total)::int as spend
      from orders o where ${PAID} group by email, shipping_address->>'fullName'
      order by spend desc limit 5
    `,
  ]);

  res.json({ stats, series, byStatus, recent, top, lowStock, topCustomers });
});

// ---------- Orders ----------

const STATUS = z.enum([
  "pending_payment",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
  "refunded",
]);

adminRouter.get("/orders", async (req, res) => {
  const { status, q, page, perPage } = z
    .object({
      status: STATUS.optional(),
      q: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().min(1).default(1),
      perPage: z.coerce.number().int().min(1).max(100).default(15),
    })
    .parse(req.query);
  const like = q ? `%${q}%` : null;
  const where = sql`where true
    ${status ? sql`and o.status = ${status}` : sql``}
    ${like ? sql`and (o.order_number ilike ${like} or o.email ilike ${like} or o.phone ilike ${like} or o.shipping_address->>'fullName' ilike ${like})` : sql``}`;

  const [countRows, items] = await Promise.all([
    sql`select count(*)::int as total from orders o ${where}`,
    sql`
      select o.id, o.order_number as "orderNumber", o.email, o.phone,
        o.shipping_address->>'fullName' as "customerName", o.status,
        o.payment_status as "paymentStatus", o.total, o.created_at as "createdAt",
        (select coalesce(sum(qty), 0)::int from order_items where order_id = o.id) as "itemCount"
      from orders o ${where}
      order by o.created_at desc
      limit ${perPage} offset ${(page - 1) * perPage}
    `,
  ]);
  const total = Number(countRows[0]?.total ?? 0);
  res.json({ items, total, pages: Math.max(1, Math.ceil(total / perPage)) });
});

adminRouter.get("/orders/:id", async (req, res) => {
  const [order] = await sql`
    select o.id, o.order_number as "orderNumber", o.email, o.phone, o.status,
      o.payment_status as "paymentStatus", o.payment_method as "paymentMethod",
      o.subtotal, o.shipping_fee as "shippingFee", o.discount, o.tax, o.total,
      o.shipping_address as "shippingAddress", o.tracking_number as "trackingNumber",
      o.courier, o.notes, o.reserved_until as "reservedUntil",
      o.created_at as "createdAt", o.updated_at as "updatedAt"
    from orders o where o.id = ${req.params.id}
  `;
  if (!order) throw notFound("Order not found");
  const [items, history] = await Promise.all([
    sql`
      select oi.id, oi.product_name as "productName", oi.sku, oi.unit_price as "unitPrice", oi.qty,
        oi.line_total as "lineTotal", p.slug,
        (select url from product_images i where i.product_id = p.id order by sort_order, created_at limit 1) as image
      from order_items oi
      left join product_variants v on v.id = oi.variant_id
      left join products p on p.id = v.product_id
      where oi.order_id = ${order.id}
    `,
    sql`
      select h.id, h.from_status as "from", h.to_status as "to", h.note,
        h.created_at as "createdAt", pr.full_name as "by"
      from order_status_history h left join profiles pr on pr.id = h.changed_by
      where h.order_id = ${order.id} order by h.created_at
    `,
  ]);
  res.json({ ...order, items, history, nextStatuses: nextStatuses(order.status) });
});

adminRouter.patch("/orders/:id/status", async (req, res) => {
  const b = z
    .object({
      status: STATUS,
      trackingNumber: z.string().trim().max(60).optional(),
      courier: z.string().trim().max(60).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .parse(req.body);
  const result = await setOrderStatus(req.params.id, b.status, { ...b, userId: req.user!.id });
  res.json(result);
});

// ---------- Collections ----------

const collectionBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(""),
  imageUrl: z.string().trim().max(500).default(""),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

adminRouter.get("/collections", async (_req, res) => {
  res.json(
    await sql`
      select c.id, c.name, c.slug, c.description, c.image_url as "imageUrl",
        c.sort_order as "sortOrder", c.is_active as "isActive",
        (select count(*)::int from product_collections pc join products p on p.id = pc.product_id
         where pc.collection_id = c.id and p.status <> 'archived') as "productCount"
      from collections c order by c.sort_order, c.name
    `,
  );
});

adminRouter.post("/collections", async (req, res) => {
  const b = collectionBody.parse(req.body);
  const slug = toSlug(b.name);
  if (!slug) throw badRequest("Name must contain letters or numbers");
  const [c] = await sql`
    insert into collections (name, slug, description, image_url, sort_order, is_active)
    values (${b.name}, ${slug}, ${b.description || null}, ${b.imageUrl || null}, ${b.sortOrder}, ${b.isActive})
    returning id
  `;
  res.status(201).json(c);
});

adminRouter.patch("/collections/:id", async (req, res) => {
  const b = collectionBody.parse(req.body);
  const [c] = await sql`
    update collections set name = ${b.name}, description = ${b.description || null},
      image_url = ${b.imageUrl || null}, sort_order = ${b.sortOrder}, is_active = ${b.isActive},
      updated_at = now()
    where id = ${req.params.id} returning id
  `;
  if (!c) throw notFound("Collection not found");
  res.json(c);
});

adminRouter.delete("/collections/:id", async (req, res) => {
  await sql`delete from collections where id = ${req.params.id}`;
  res.json({ ok: true });
});

// ---------- Customers ----------

adminRouter.get("/customers", async (req, res) => {
  const { q } = z.object({ q: z.string().trim().max(100).optional() }).parse(req.query);
  const like = q ? `%${q}%` : null;
  res.json(
    await sql`
      select pr.id, pr.full_name as "fullName", pr.email, pr.phone, pr.role,
        pr.created_at as "createdAt",
        (select count(*)::int from orders o where o.user_id = pr.id and ${PAID}) as orders,
        (select coalesce(sum(total), 0)::int from orders o where o.user_id = pr.id and ${PAID}) as spend
      from profiles pr
      ${like ? sql`where pr.full_name ilike ${like} or pr.email ilike ${like} or pr.phone ilike ${like}` : sql``}
      order by pr.created_at desc
    `,
  );
});

adminRouter.patch("/customers/:id", async (req, res) => {
  const { role } = z.object({ role: z.enum(["customer", "admin"]) }).parse(req.body);
  if (req.params.id === req.user!.id) throw badRequest("You can't change your own role");
  const [u] = await sql`update profiles set role = ${role} where id = ${req.params.id} returning id`;
  if (!u) throw notFound("User not found");
  res.json(u);
});
