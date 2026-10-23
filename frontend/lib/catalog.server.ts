import "server-only";
import { cacheLife } from "next/cache";
import type { Collection, Product } from "./catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Cached GET against the API. Stock changes with every order, so entries are
 * short-lived (refreshed every 15s). That makes callers request-time
 * "dynamic holes": render them inside <Suspense>.
 * Returns null on 404 or when the API is unreachable.
 */
async function getJSON<T>(path: string): Promise<T | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 15, expire: 60 });
  try {
    const res = await fetch(`${API_URL}/api${path}`);
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
