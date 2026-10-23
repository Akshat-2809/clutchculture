// Catalogue types shared by server and client. Data comes from the Express API
// (backend/src/routes/catalog.ts). Prices are in paise.

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  scale: string;
  series: string;
  material: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  /** Slug of the product's main collection. */
  collection: string;
  /** Units customers can still buy (stock minus units held by unpaid orders). */
  stock: number;
};

export type ProductSummary = Pick<
  Product,
  "slug" | "brand" | "name" | "image" | "price" | "compareAtPrice" | "stock"
>;

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export function savePercent({ price, compareAtPrice }: ProductSummary) {
  return compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : null;
}
