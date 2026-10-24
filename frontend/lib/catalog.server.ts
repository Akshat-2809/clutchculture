import "server-only";
import { cacheLife } from "next/cache";
import type { Collection, Product } from "./catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Cached GET against the API (stale-while-revalidate). Visitors always get the
 * cached copy instantly; after 30s the next request refreshes it in the
 * background, so stock shown on pages is at most ~30s old (checkout re-checks
 * stock on the server). The long expiry means pages never wait on the API —
 * important because Render's free plan can take ~50s to wake — and lets
 * Next prerender pages like the home page as static HTML.
 * Returns null on 404, timeout, or when the API is unreachable.
 */
async function getJSON<T>(path: string): Promise<T | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 30, expire: 60 * 60 * 24 * 7 });
  try {
    const res = await fetch(`${API_URL}/api${path}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getFeaturedProducts = async () =>
  (await getJSON<Product[]>("/products?featured=1")) ?? [];

export const getProductDetail = (slug: string) =>
  getJSON<{ product: Product & { collectionName: string | null }; related: Product[] }>(
    `/products/${encodeURIComponent(slug)}`,
  );

export const getCollections = async () => (await getJSON<Collection[]>("/collections")) ?? [];

export const getCollectionDetail = (slug: string) =>
  getJSON<{ collection: Collection; products: Product[] }>(
    `/collections/${encodeURIComponent(slug)}`,
  );

export const getTrendingProducts = async () =>
  (await getJSON<Product[]>("/products?trending=1")) ?? [];

export const getAllProducts = async () => (await getJSON<Product[]>("/products")) ?? [];
