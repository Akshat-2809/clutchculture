import { Router } from "express";
import { z } from "zod";
import { sql } from "../db/client.js";
import { notFound } from "../lib/httpError.js";
import { checkoutLimiter } from "../middleware/rateLimit.js";
import { ACTIVE, RECENT_UNITS_SOLD, selectProducts, toPublicProduct } from "../services/catalog.js";

export const catalogRouter = Router();

const listQuery = z.object({
  collection: z.string().optional(),
  featured: z.literal("1").optional(),
  trending: z.literal("1").optional(),
  // Comma-separated slugs (cart / wishlist lookups).
  slugs: z.string().optional(),
  q: z.string().trim().max(100).optional(),
});

catalogRouter.get("/products", async (req, res) => {
  const { collection, featured, trending, slugs, q } = listQuery.parse(req.query);
  const slugList = slugs?.split(",").filter(Boolean).slice(0, 100);

  const rows = await selectProducts(
    sql`${ACTIVE}
      ${collection ? sql`and exists (select 1 from product_collections pc join collections c on c.id = pc.collection_id where pc.product_id = p.id and c.slug = ${collection})` : sql``}
      ${featured ? sql`and p.is_featured` : sql``}
      ${trending ? sql`and p.is_trending` : sql``}
      ${slugList ? (slugList.length ? sql`and p.slug in ${sql(slugList)}` : sql`and false`) : sql``}
      ${q ? sql`and (p.name ilike ${"%" + q + "%"} or p.brand ilike ${"%" + q + "%"} or p.series ilike ${"%" + q + "%"})` : sql``}`,
    // Trending: best sellers of the last 30 days first.
    trending ? sql`order by ${RECENT_UNITS_SOLD} desc, p.created_at desc` : sql`order by p.created_at`,
  );
  res.json(rows.map(toPublicProduct));
});

catalogRouter.get("/products/:slug", async (req, res) => {
  const [product] = await selectProducts(sql`${ACTIVE} and p.slug = ${req.params.slug}`);
  if (!product) throw notFound("Product not found");

  // Same collection first, then the rest.
  const collectionId = product.collections[0]?.id ?? null;
  const related = await selectProducts(
    sql`${ACTIVE} and p.id <> ${product.id}`,
    sql`order by (exists (select 1 from product_collections pc where pc.product_id = p.id and pc.collection_id = ${collectionId})) desc, p.created_at limit 10`,
  );

  res.json({
    product: {
      ...toPublicProduct(product),
      collectionName: product.collections[0]?.name ?? null,
    },
    related: related.map(toPublicProduct),
  });
});

catalogRouter.post("/newsletter", checkoutLimiter, async (req, res) => {
  const { email, whatsapp } = z
    .object({
      email: z.email(),
      whatsapp: z
        .string()
        .trim()
        .transform((v) => v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))
        .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"))
        .optional(),
    })
    .parse(req.body);
  await sql`
    insert into newsletter_subscribers (email, whatsapp_phone)
    values (${email.toLowerCase()}, ${whatsapp ?? null})
    on conflict (email) do update
      set whatsapp_phone = coalesce(excluded.whatsapp_phone, newsletter_subscribers.whatsapp_phone)
  `;
  res.status(201).json({ ok: true });
});

catalogRouter.get("/collections", async (_req, res) => {
  const rows = await sql`
    select c.id, c.name, c.slug, c.description, c.image_url as "imageUrl",
      (select count(*)::int from product_collections pc join products p on p.id = pc.product_id
       where pc.collection_id = c.id and p.status = 'active') as "productCount"
    from collections c where c.is_active order by c.sort_order, c.name
  `;
  res.json(rows);
});

catalogRouter.get("/collections/:slug", async (req, res) => {
  const [collection] = await sql`
    select id, name, slug, description, image_url as "imageUrl"
    from collections where slug = ${req.params.slug} and is_active
  `;
  if (!collection) throw notFound("Collection not found");
  const products = await selectProducts(
    sql`${ACTIVE} and exists (select 1 from product_collections pc where pc.product_id = p.id and pc.collection_id = ${collection.id})`,
    sql`order by p.created_at`,
  );
  res.json({ collection, products: products.map(toPublicProduct) });
});
