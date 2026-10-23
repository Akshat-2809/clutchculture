// Loads the sample catalogue (collections + products with stock) into the database.
// Safe to re-run: existing collections/products (matched by slug) are left alone.
// Usage: npm run db:seed
import { readFileSync } from "node:fs";
import { setStock } from "../services/inventory.js";
import { sql } from "./client.js";

type SeedData = {
  collections: { slug: string; name: string; description: string; sortOrder: number }[];
  products: {
    slug: string;
    name: string;
    brand: string;
    scale: string;
    series: string;
    material: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    image: string;
    collection: string;
    featured: boolean;
    trending: boolean;
    sku: string;
  }[];
};

const data: SeedData = JSON.parse(
  readFileSync(new URL("./seed-data.json", import.meta.url), "utf8"),
);

let addedCollections = 0;
let addedProducts = 0;

await sql.begin(async (tx) => {
  for (const c of data.collections) {
    const rows = await tx`
      insert into collections (name, slug, description, sort_order)
      values (${c.name}, ${c.slug}, ${c.description}, ${c.sortOrder})
      on conflict (slug) do nothing returning id
    `;
    addedCollections += rows.length;
  }

  for (const p of data.products) {
    const [created] = await tx<{ id: string }[]>`
      insert into products (name, slug, brand, scale, series, material, description, base_price,
        compare_at_price, status, is_featured, is_trending)
      values (${p.name}, ${p.slug}, ${p.brand}, ${p.scale}, ${p.series}, ${p.material},
        ${p.description}, ${p.price}, ${p.compareAtPrice}, 'active', ${p.featured}, ${p.trending})
      on conflict (slug) do nothing returning id
    `;
    if (!created) continue;
    addedProducts++;

    const [v] = await tx<[{ id: string }]>`
      insert into product_variants (product_id, sku, size, stock_qty)
      values (${created.id}, ${p.sku}, 'Standard', 0) returning id
    `;
    await setStock(tx, v.id, p.stock, { note: "Seed: opening stock" });
    // Sample photos live in the frontend's /public folder.
    await tx`insert into product_images (product_id, url, alt, sort_order) values (${created.id}, ${p.image}, ${p.name}, 0)`;
    await tx`
      insert into product_collections (product_id, collection_id)
      select ${created.id}, id from collections where slug = ${p.collection}
    `;
  }
});

console.log(`Seeded ${addedCollections} collections and ${addedProducts} products.`);
await sql.end();
