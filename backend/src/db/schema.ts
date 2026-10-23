import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// All money columns are integers in paise (₹499 = 49900), matching Razorpay.

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const timestamps = {
  createdAt,
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------- Enums ----------

export const userRole = pgEnum("user_role", ["customer", "admin"]);
export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);
export const orderStatus = pgEnum("order_status", [
  "pending_payment",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
  "refunded",
]);
export const orderPaymentStatus = pgEnum("order_payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);
export const paymentMethod = pgEnum("payment_method", ["razorpay", "cod"]);
export const paymentStatus = pgEnum("payment_status", [
  "created",
  "authorized",
  "captured",
  "failed",
]);
export const refundStatus = pgEnum("refund_status", ["pending", "processed", "failed"]);
export const inventoryReason = pgEnum("inventory_reason", [
  "order",
  "cancel",
  "restock",
  "manual",
  "return",
]);
export const couponType = pgEnum("coupon_type", ["percent", "flat"]);

// ---------- Users ----------

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  role: userRole("role").notNull().default("customer"),
  ...timestamps,
});

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    landmark: text("landmark"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    country: text("country").notNull().default("IN"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

// ---------- Catalog ----------

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    basePrice: integer("base_price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    hsnCode: text("hsn_code"),
    gstRate: integer("gst_rate").notNull().default(5), // percent
    status: productStatus("status").notNull().default("draft"),
    ...timestamps,
  },
  (t) => [
    index("products_status_idx").on(t.status),
    check("products_base_price_check", sql`${t.basePrice} >= 0`),
  ],
);

export const productCollections = pgTable(
  "product_collections",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    size: text("size").notNull(),
    color: text("color"),
    priceOverride: integer("price_override"),
    stockQty: integer("stock_qty").notNull().default(0),
    // Held by unpaid orders; available = stock_qty - reserved_qty.
    reservedQty: integer("reserved_qty").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("product_variants_product_idx").on(t.productId),
    check("product_variants_stock_check", sql`${t.stockQty} >= 0`),
    check(
      "product_variants_reserved_check",
      sql`${t.reservedQty} >= 0 AND ${t.reservedQty} <= ${t.stockQty}`,
    ),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    change: integer("change").notNull(),
    reason: inventoryReason("reason").notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [index("inventory_movements_variant_idx").on(t.variantId)],
);

// ---------- Cart & wishlist ----------

// Logged-in carts only; guest carts live in localStorage and merge on login.
export const cartItems = pgTable(
  "cart_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.variantId] }),
    check("cart_items_qty_check", sql`${t.qty} > 0`),
  ],
);

export const wishlist = pgTable(
  "wishlist",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

// ---------- Coupons ----------

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  type: couponType("type").notNull(),
  value: integer("value").notNull(), // percent, or paise for flat
  minOrder: integer("min_order").notNull().default(0),
  maxDiscount: integer("max_discount"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

// ---------- Orders ----------

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 10001 });

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number")
      .notNull()
      .unique()
      .default(sql`('CC-' || nextval('order_number_seq'))`),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    status: orderStatus("status").notNull().default("pending_payment"),
    paymentStatus: orderPaymentStatus("payment_status").notNull().default("pending"),
    paymentMethod: paymentMethod("payment_method").notNull().default("razorpay"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>().notNull(),
    trackingNumber: text("tracking_number"),
    courier: text("courier"),
    // Stock reservation expiry for unpaid orders.
    reservedUntil: timestamp("reserved_until", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_at_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Snapshot at purchase time so later product edits don't change past orders.
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    size: text("size").notNull(),
    color: text("color"),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
    gstRate: integer("gst_rate").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    note: text("note"),
    changedBy: uuid("changed_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt,
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId)],
);

// ---------- Payments ----------

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatus("status").notNull().default("created"),
    method: text("method"), // upi, card, netbanking, wallet
    raw: jsonb("raw"),
    ...timestamps,
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    razorpayRefundId: text("razorpay_refund_id").unique(),
    amount: integer("amount").notNull(),
    reason: text("reason"),
    status: refundStatus("status").notNull().default("pending"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("refunds_order_idx").on(t.orderId)],
);

// Razorpay event id is the primary key, so a redelivered webhook is a no-op insert.
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
