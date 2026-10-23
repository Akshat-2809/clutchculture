"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/catalog";
import { savePercent } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const SORTS = {
  featured: { label: "Featured", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a: Product, b: Product) => b.price - a.price },
  savings: {
    label: "Biggest savings",
    fn: (a: Product, b: Product) => (savePercent(b) ?? 0) - (savePercent(a) ?? 0),
  },
} as const;
type SortKey = keyof typeof SORTS;

const chip = "h-9 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors";

export function CollectionGrid({ products }: { products: Product[] }) {
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const [brand, setBrand] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");

  const visible = useMemo(
    () =>
      products
        .filter((p) => (!brand || p.brand === brand) && (!inStockOnly || p.stock > 0))
        .toSorted(SORTS[sort].fn),
    [products, brand, inStockOnly, sort],
  );

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 scrollbar-none flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setBrand(null)}
            className={cn(
              chip,
              brand === null
                ? "border-ink bg-ink text-background"
                : "border-input-border text-ink hover:border-ink",
            )}
          >
            All brands
          </button>
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(brand === b ? null : b)}
              aria-pressed={brand === b}
              className={cn(
                chip,
                brand === b
                  ? "border-ink bg-ink text-background"
                  : "border-input-border text-ink hover:border-ink",
              )}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="size-4 accent-ink"
            />
            In stock only
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-full border border-input-border bg-background px-3 text-sm font-medium text-ink outline-none focus:border-ink"
            >
              {Object.entries(SORTS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? "model" : "models"}
      </p>

      {visible.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {visible.map((product) => (
            <li key={product.slug}>
              <ProductCard
                product={product}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-ink">Nothing matches those filters.</p>
          <button
            type="button"
            onClick={() => {
              setBrand(null);
              setInStockOnly(false);
            }}
            className="mt-4 text-sm font-semibold text-ink underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
