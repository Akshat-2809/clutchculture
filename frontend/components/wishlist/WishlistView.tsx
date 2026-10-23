"use client";

import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { useProductsBySlugs } from "@/lib/use-products";
import { useWishlist, useWishlistHydrated } from "@/store/wishlist";

export function WishlistView() {
  const hydrated = useWishlistHydrated();
  const slugs = useWishlist((s) => s.slugs);
  const found = useProductsBySlugs(slugs);

  if (!hydrated || (slugs.length > 0 && !found.data)) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  const products = slugs.flatMap((slug) => found.data?.get(slug) ?? []);

  return (
    <>
      <p className="-mt-6 mb-8 text-muted">
        {products.length} saved {products.length === 1 ? "model" : "models"}
      </p>

      {products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard
                product={product}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-surface">
            <Heart className="size-9 text-ink" strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-ink">Nothing saved yet</h2>
          <p className="mt-2 max-w-sm text-muted">
            Tap the heart on any model to save it for later.
          </p>
          <Link
            href="/collections/new-drops"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-background transition hover:bg-ink/85"
          >
            Explore new drops <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </>
  );
}
