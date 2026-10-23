import { randomUUID } from "node:crypto";
import express, { Router } from "express";
import { z } from "zod";
import { sql } from "../../db/client.js";
import { badRequest, notFound } from "../../lib/httpError.js";
import { PRODUCT_IMAGES_BUCKET, supabaseAdmin } from "../../lib/supabase.js";
import { selectProducts } from "../../services/catalog.js";
import { setStock, type Tx } from "../../services/inventory.js";

export const adminProductsRouter = Router();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = base;
  for (let n = 2; ; n++) {
    const [taken] = await sql`
      select 1 from products where slug = ${slug} ${exceptId ? sql`and id <> ${exceptId}` : sql``}
    `;
    if (!taken) return slug;
    slug = `${base}-${n}`;
  }
}

const money = z.number().int().min(0);
const productBody = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: z.string().trim().max(80).optional(),
    brand: z.string().trim().max(80).default(""),
    scale: z.string().trim().max(20).default(""),
    series: z.string().trim().max(80).default(""),
    material: z.string().trim().max(120).default(""),
    description: z.string().trim().max(5000).default(""),
    price: money.min(100, "Price must be at least ₹1"), // paise
    compareAtPrice: money.nullable().default(null),
    sku: z.string().trim().min(2).max(60),
    stock: z.number().int().min(0).max(100000),
    lowStockThreshold: z.number().int().min(0).max(1000).default(3),
    status: z.enum(["draft", "active", "archived"]).default("active"),
    isFeatured: z.boolean().default(false),
    isTrending: z.boolean().default(false),
    collectionIds: z.array(z.uuid()).default([]),
  })
  .refine((b) => b.compareAtPrice === null || b.compareAtPrice > b.price, {
    message: "MRP should be higher than the selling price",
    path: ["compareAtPrice"],
  });

const nullIfEmpty = (s: string) => s || null;

async function setCollections(tx: Tx, productId: string, ids: string[]) {
  await tx`delete from product_collections where product_id = ${productId}`;
  for (const [i, id] of ids.entries()) {
    await tx`insert into product_collections (product_id, collection_id, sort_order) values (${productId}, ${id}, ${i})`;
  }
}

async function getAdminProduct(id: string) {
  const [p] = await selectProducts(sql`and p.id = ${id}`);
  if (!p) throw notFound("Product not found");
  return p;
}

// ---------- List / read ----------

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  collection: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  stock: z.enum(["low", "out"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
});

adminProductsRouter.get("/products", async (req, res) => {
  const { q, collection, status, stock, page, perPage } = listQuery.parse(req.query);
  const like = q ? `%${q}%` : null;
  const where = sql`
    ${status ? sql`and p.status = ${status}` : sql`and p.status <> 'archived'`}
    ${like ? sql`and (p.name ilike ${like} or p.brand ilike ${like} or p.series ilike ${like} or v.sku ilike ${like})` : sql``}
    ${collection ? sql`and exists (select 1 from product_collections pc join collections c on c.id = pc.collection_id where pc.product_id = p.id and c.slug = ${collection})` : sql``}
    ${stock === "out" ? sql`and coalesce(v.stock_qty, 0) - coalesce(v.reserved_qty, 0) <= 0` : sql``}
    ${stock === "low" ? sql`and coalesce(v.stock_qty, 0) - coalesce(v.reserved_qty, 0) <= coalesce(v.low_stock_threshold, 3)` : sql``}
  `;
  const all = await selectProducts(where, sql`order by p.created_at desc`);
  res.json({
    items: all.slice((page - 1) * perPage, page * perPage),
    total: all.length,
    pages: Math.max(1, Math.ceil(all.length / perPage)),
  });
});

adminProductsRouter.get("/products/:id", async (req, res) => {
  res.json(await getAdminProduct(req.params.id));
});

/** Stock history for the product's variant. */
adminProductsRouter.get("/products/:id/movements", async (req, res) => {
  const rows = await sql`
    select m.id, m.change, m.reason, m.note, m.created_at as "createdAt",
      o.order_number as "orderNumber", pr.full_name as "by"
    from inventory_movements m
    join product_variants v on v.id = m.variant_id
    left join orders o on o.id = m.order_id
    left join profiles pr on pr.id = m.created_by
    where v.product_id = ${req.params.id}
    order by m.created_at desc limit 25
  `;
  res.json(rows);
});

// ---------- Create / update / delete ----------

adminProductsRouter.post("/products", async (req, res) => {
  const b = productBody.parse(req.body);
  const slug = await uniqueSlug(slugify(b.slug || b.name));

  const id = await sql.begin(async (tx) => {
    const [p] = await tx<[{ id: string }]>`
      insert into products (name, slug, brand, scale, series, material, description, base_price,
        compare_at_price, status, is_featured, is_trending)
      values (${b.name}, ${slug}, ${nullIfEmpty(b.brand)}, ${nullIfEmpty(b.scale)},
        ${nullIfEmpty(b.series)}, ${nullIfEmpty(b.material)}, ${nullIfEmpty(b.description)},
        ${b.price}, ${b.compareAtPrice}, ${b.status}, ${b.isFeatured}, ${b.isTrending})
      returning id
    `;
    const [v] = await tx<[{ id: string }]>`
      insert into product_variants (product_id, sku, size, stock_qty, low_stock_threshold)
      values (${p.id}, ${b.sku}, 'Standard', 0, ${b.lowStockThreshold})
      returning id
    `;
    await setStock(tx, v.id, b.stock, { note: "Initial stock", userId: req.user!.id });
    await setCollections(tx, p.id, b.collectionIds);
    return p.id;
  });
  res.status(201).json(await getAdminProduct(id));
});

adminProductsRouter.patch("/products/:id", async (req, res) => {
  const current = await getAdminProduct(req.params.id);
  const b = productBody.parse({
    // Allow partial updates (e.g. the list's visibility toggle).
    name: current.name,
    brand: current.brand ?? "",
    scale: current.scale ?? "",
    series: current.series ?? "",
    material: current.material ?? "",
    description: current.description ?? "",
    price: current.price,
    compareAtPrice: current.compareAtPrice,
    sku: current.sku ?? "",
    stock: current.stockQty,
    lowStockThreshold: current.lowStockThreshold,
    status: current.status,
    isFeatured: current.isFeatured,
    isTrending: current.isTrending,
    collectionIds: current.collections.map((c) => c.id),
    ...req.body,
  });
  const slug = b.slug ? await uniqueSlug(slugify(b.slug), current.id) : current.slug;

  await sql.begin(async (tx) => {
    await tx`
      update products set name = ${b.name}, slug = ${slug}, brand = ${nullIfEmpty(b.brand)},
        scale = ${nullIfEmpty(b.scale)}, series = ${nullIfEmpty(b.series)},
        material = ${nullIfEmpty(b.material)}, description = ${nullIfEmpty(b.description)},
        base_price = ${b.price}, compare_at_price = ${b.compareAtPrice}, status = ${b.status},
        is_featured = ${b.isFeatured}, is_trending = ${b.isTrending}, updated_at = now()
      where id = ${current.id}
    `;
    if (current.variantId) {
      await tx`
        update product_variants set sku = ${b.sku}, low_stock_threshold = ${b.lowStockThreshold}
        where id = ${current.variantId}
      `;
      await setStock(tx, current.variantId, b.stock, {
        note: "Updated in admin",
        userId: req.user!.id,
      });
    }
    await setCollections(tx, current.id, b.collectionIds);
  });
  res.json(await getAdminProduct(current.id));
});

adminProductsRouter.delete("/products/:id", async (req, res) => {
  const p = await getAdminProduct(req.params.id);
  const [ordered] = await sql`
    select 1 from order_items oi join product_variants v on v.id = oi.variant_id
    where v.product_id = ${p.id} limit 1
  `;
  if (ordered) {
    // Keep order history intact: hide instead of deleting.
    await sql`update products set status = 'archived', updated_at = now() where id = ${p.id}`;
    res.json({ archived: true, message: `"${p.name}" has orders, so it was archived instead` });
    return;
  }
  await sql`delete from products where id = ${p.id}`;
  await removeStorageFiles(p.images.map((i) => i.url));
  res.json({ archived: false, message: `"${p.name}" deleted` });
});

// ---------- Images ----------

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const storagePrefix = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

async function removeStorageFiles(urls: string[]) {
  const paths = urls.filter((u) => u.includes(storagePrefix)).map((u) => u.split(storagePrefix)[1]!);
  if (paths.length) await supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
}

adminProductsRouter.post(
  "/products/:id/images",
  express.raw({ type: Object.keys(EXT), limit: "5mb" }),
  async (req, res) => {
    const type = req.header("content-type") as keyof typeof EXT;
    if (!EXT[type] || !Buffer.isBuffer(req.body) || !req.body.length) {
      throw badRequest("Upload a JPEG, PNG or WebP image (max 5 MB)");
    }
    const p = await getAdminProduct(req.params.id);
    const path = `${p.id}/${randomUUID()}.${EXT[type]}`;
    const { error } = await supabaseAdmin.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, req.body, { contentType: type, cacheControl: "31536000" });
    if (error) throw badRequest(`Upload failed: ${error.message}`);
    const { publicUrl } = supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data;

    const cover = req.query.cover === "1";
    await sql`
      insert into product_images (product_id, url, alt, sort_order)
      values (${p.id}, ${publicUrl}, ${p.name},
        ${cover ? sql`(select coalesce(min(sort_order), 0) - 1 from product_images where product_id = ${p.id})` : sql`(select coalesce(max(sort_order), -1) + 1 from product_images where product_id = ${p.id})`})
    `;
    res.status(201).json(await getAdminProduct(p.id));
  },
);

adminProductsRouter.post("/products/:id/images/:imageId/cover", async (req, res) => {
  const p = await getAdminProduct(req.params.id);
  const order = [req.params.imageId, ...p.images.map((i) => i.id).filter((i) => i !== req.params.imageId)];
  await sql.begin(async (tx) => {
    for (const [i, imageId] of order.entries()) {
      await tx`update product_images set sort_order = ${i} where id = ${imageId} and product_id = ${p.id}`;
    }
  });
  res.json(await getAdminProduct(p.id));
});

adminProductsRouter.delete("/products/:id/images/:imageId", async (req, res) => {
  const [img] = await sql<{ url: string }[]>`
    delete from product_images where id = ${req.params.imageId} and product_id = ${req.params.id}
    returning url
  `;
  if (!img) throw notFound("Image not found");
  await removeStorageFiles([img.url]);
  res.json(await getAdminProduct(req.params.id));
});
