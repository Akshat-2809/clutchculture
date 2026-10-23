import type { PendingQuery, Row } from "postgres";
import { sql } from "../db/client.js";

// Each product has one default variant (its first) holding SKU and stock. The
// schema supports more (sizes/colours) if the catalogue ever needs them.

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  scale: string | null;
  series: string | null;
  material: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
  variantId: string | null;
  sku: string | null;
  stockQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  /** stock_qty - reserved_qty: what customers can still buy. */
  available: number;
  images: { id: string; url: string }[];
  collections: { id: string; slug: string; name: string }[];
};

type Fragment = PendingQuery<Row[]>;

/** Select products with their default variant, images and collections. */
export function selectProducts(where: Fragment = sql``, tail: Fragment = sql``) {
  return sql<ProductRow[]>`
    select
      p.id, p.slug, p.name, p.brand, p.scale, p.series, p.material, p.description,
      p.base_price as "price", p.compare_at_price as "compareAtPrice", p.status,
      p.is_featured as "isFeatured", p.is_trending as "isTrending", p.created_at as "createdAt",
      v.id as "variantId", v.sku,
      coalesce(v.stock_qty, 0) as "stockQty",
      coalesce(v.reserved_qty, 0) as "reservedQty",
      coalesce(v.low_stock_threshold, 3) as "lowStockThreshold",
      greatest(coalesce(v.stock_qty, 0) - coalesce(v.reserved_qty, 0), 0) as "available",
      coalesce((
        select json_agg(json_build_object('id', i.id, 'url', i.url) order by i.sort_order, i.created_at)
        from product_images i where i.product_id = p.id
      ), '[]') as "images",
      coalesce((
        select json_agg(json_build_object('id', c.id, 'slug', c.slug, 'name', c.name) order by c.sort_order)
        from product_collections pc join collections c on c.id = pc.collection_id
        where pc.product_id = p.id
      ), '[]') as "collections"
    from products p
    left join lateral (
      select * from product_variants pv where pv.product_id = p.id order by pv.created_at limit 1
    ) v on true
    where true ${where}
    ${tail}
  `;
}

/** Shape sent to the storefront (no internal stock numbers). */
export function toPublicProduct(p: ProductRow) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? "",
    scale: p.scale ?? "",
    series: p.series ?? "",
    material: p.material ?? "",
    description: p.description ?? "",
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    image: p.images[0]?.url ?? "",
    images: p.images.map((i) => i.url),
    collection: p.collections[0]?.slug ?? "",
    stock: p.available,
  };
}

export const ACTIVE = sql`and p.status = 'active'`;

/** Paid units sold in the last 30 days — used to order the Trending grid. */
export const RECENT_UNITS_SOLD = sql`(
  select coalesce(sum(oi.qty), 0) from order_items oi
  join product_variants pv on pv.id = oi.variant_id
  join orders o on o.id = oi.order_id
  where pv.product_id = p.id and o.payment_status = 'paid' and o.created_at > now() - interval '30 days'
)`;
