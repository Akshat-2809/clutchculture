"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Collection, Product } from "./catalog";

/** Live product lookup by slug (Garage, checkout, wishlist). */
export function useProductsBySlugs(slugs: string[]) {
  const key = [...slugs].sort().join(",");
  return useQuery({
    queryKey: ["products", "slugs", key],
    queryFn: () => api<Product[]>(`/products?slugs=${encodeURIComponent(key)}`),
    enabled: slugs.length > 0,
    staleTime: 15_000,
    select: (list) => new Map(list.map((p) => [p.slug, p])),
  });
}

/** Active products, optionally narrowed by collection / search (shop page). */
export function useProducts(params: { collection?: string; q?: string; trending?: boolean }) {
  const qs = new URLSearchParams();
  if (params.collection) qs.set("collection", params.collection);
  if (params.q) qs.set("q", params.q);
  if (params.trending) qs.set("trending", "1");
  return useQuery({
    queryKey: ["products", "list", qs.toString()],
    queryFn: () => api<Product[]>(`/products?${qs}`),
    staleTime: 15_000,
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => api<Collection[]>("/collections"),
    staleTime: 5 * 60_000,
  });
}
