"use client";

import {
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { type Product, savePercent } from "@/lib/catalog";
import { useCollections, useProducts } from "@/lib/use-products";
import { cn, formatPrice } from "@/lib/utils";

const SORTS = {
  newest: { label: "Newest", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a: Product, b: Product) => b.price - a.price },
  savings: {
    label: "Biggest discount",
    fn: (a: Product, b: Product) => (savePercent(b) ?? 0) - (savePercent(a) ?? 0),
  },
} as const;
type SortKey = keyof typeof SORTS;

// Rupee bands (prices in the URL are rupees for readability).
const PRICE_BANDS: [number, number | null][] = [
  [0, 499],
  [500, 999],
  [1000, 1999],
  [2000, null],
];
const PER_PAGE = 12;
const chip = "h-8 rounded-full border px-3 text-xs font-medium transition";

function useShopParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const set = (patch: Record<string, string | string[] | number | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      next.delete(k);
      if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
      else if (v !== null && v !== "") next.set(k, String(v));
    }
    if (!("page" in patch)) next.delete("page");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  return {
    params,
    set,
    q: params.get("q") ?? "",
    collection: params.get("collection") ?? "",
    brands: params.getAll("brand"),
    min: params.get("min"),
    max: params.get("max"),
    inStock: params.get("stock") === "1",
    trending: params.get("trending") === "1",
    sort: (params.get("sort") as SortKey) in SORTS ? (params.get("sort") as SortKey) : "newest",
    page: Math.max(1, Number(params.get("page") ?? 1) || 1),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-0">
      <h4 className="mb-3 text-sm font-semibold text-ink">{title}</h4>
      {children}
    </div>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink/75 transition hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-ink" />
      {children}
    </label>
  );
}

function Filters({ s, brands }: { s: ReturnType<typeof useShopParams>; brands: string[] }) {
  const { data: collections = [] } = useCollections();

  return (
    <div>
      <Section title="Collection">
        <div className="space-y-0.5">
          {[{ slug: "", name: "All cars", productCount: undefined }, ...collections].map((c) => {
            const active = s.collection === c.slug;
            return (
              <button
                key={c.slug || "all"}
                onClick={() => s.set({ collection: c.slug || null, brand: null })}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                  active
                    ? "bg-ink font-semibold text-background"
                    : "text-ink/75 hover:bg-input hover:text-ink",
                )}
              >
                {c.name}
                {c.productCount != null && (
                  <span className={cn("text-xs", active ? "text-background/70" : "text-muted")}>
                    {c.productCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map(([lo, hi]) => {
            const active = s.min === String(lo) && (s.max ?? "") === (hi ? String(hi) : "");
            return (
              <button
                key={lo}
                onClick={() => s.set(active ? { min: null, max: null } : { min: lo, max: hi })}
                className={cn(
                  chip,
                  active
                    ? "border-ink bg-ink text-background"
                    : "border-input-border text-ink hover:border-ink",
                )}
              >
                {hi ? `₹${lo} – ₹${hi}` : `₹${lo}+`}
              </button>
            );
          })}
        </div>
        {/* key resets the inputs when the URL price changes */}
        <PriceInputs key={`${s.min}-${s.max}`} s={s} />
      </Section>

      {brands.length > 0 && (
        <Section title="Brand">
          {brands.map((b) => (
            <Check
              key={b}
              checked={s.brands.includes(b)}
              onChange={() =>
                s.set({
                  brand: s.brands.includes(b) ? s.brands.filter((x) => x !== b) : [...s.brands, b],
                })
              }
            >
              {b}
            </Check>
          ))}
        </Section>
      )}

      <Section title="Availability">
        <Check checked={s.inStock} onChange={() => s.set({ stock: s.inStock ? null : "1" })}>
          In stock only
        </Check>
      </Section>
    </div>
  );
}

function PriceInputs({ s }: { s: ReturnType<typeof useShopParams> }) {
  const [min, setMin] = useState(s.min ?? "");
  const [max, setMax] = useState(s.max ?? "");
  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        s.set({ min: min || null, max: max || null });
      }}
    >
      <input
        className="h-9 w-full rounded-xl border border-input-border bg-input px-3 text-sm text-ink outline-none focus:border-ink/40"
        inputMode="numeric"
        placeholder="Min ₹"
        value={min}
        onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
        aria-label="Minimum price"
      />
      <span className="text-muted">–</span>
      <input
        className="h-9 w-full rounded-xl border border-input-border bg-input px-3 text-sm text-ink outline-none focus:border-ink/40"
        inputMode="numeric"
        placeholder="Max ₹"
        value={max}
        onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
        aria-label="Maximum price"
      />
      <button className="h-9 shrink-0 rounded-xl bg-ink px-3 text-sm font-semibold text-background">
        Go
      </button>
    </form>
  );
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );
  const arrow =
    "flex size-10 items-center justify-center rounded-full border border-input-border text-ink disabled:opacity-40";
  return (
    <nav className="mt-14 flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        className={arrow}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-[18px]" />
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
          <button
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              "h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition",
              n === page ? "bg-ink text-background" : "text-ink/70 hover:bg-input",
            )}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        className={arrow}
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-[18px]" />
      </button>
    </nav>
  );
}

export function ShopView() {
  const s = useShopParams();
  const [drawer, setDrawer] = useState(false);
  const { data: collections = [] } = useCollections();
  const {
    data: products,
    isPending,
    isFetching,
    isError,
  } = useProducts({
    collection: s.collection || undefined,
    q: s.q || undefined,
    trending: s.trending,
  });

  // The catalogue is small, so brand / price / stock / sort run in the browser.
  const brands = useMemo(
    () => [...new Set((products ?? []).map((p) => p.brand).filter(Boolean))].sort(),
    [products],
  );
  const filtered = useMemo(() => {
    const minPaise = s.min ? Number(s.min) * 100 : null;
    const maxPaise = s.max ? Number(s.max) * 100 : null;
    return (products ?? [])
      .filter(
        (p) =>
          (!s.brands.length || s.brands.includes(p.brand)) &&
          (minPaise === null || p.price >= minPaise) &&
          (maxPaise === null || p.price <= maxPaise) &&
          (!s.inStock || p.stock > 0),
      )
      .toSorted(SORTS[s.sort].fn);
  }, [products, s.brands, s.min, s.max, s.inStock, s.sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(s.page, pages);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const collection = collections.find((c) => c.slug === s.collection);
  const title = s.q
    ? `Results for “${s.q}”`
    : s.trending
      ? "Trending now"
      : s.sort === "savings" && !collection
        ? "Today's Deals"
        : (collection?.name ?? "All cars");

  const chips: { key: string; label: string; clear: () => void }[] = [
    s.q && { key: "q", label: `“${s.q}”`, clear: () => s.set({ q: null }) },
    ...s.brands.map((b) => ({
      key: `brand-${b}`,
      label: b,
      clear: () => s.set({ brand: s.brands.filter((x) => x !== b) }),
    })),
    (s.min || s.max) && {
      key: "price",
      label: `${s.min ? formatPrice(Number(s.min) * 100) : "₹0"} – ${s.max ? formatPrice(Number(s.max) * 100) : "any"}`,
      clear: () => s.set({ min: null, max: null }),
    },
    s.inStock && { key: "stock", label: "In stock", clear: () => s.set({ stock: null }) },
  ].filter((c): c is { key: string; label: string; clear: () => void } => Boolean(c));

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-16 sm:px-6 lg:px-10">
      <nav className="mb-4 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-1">/</span>
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        {collection && (
          <>
            <span className="mx-1">/</span>
            <span className="text-ink">{collection.name}</span>
          </>
        )}
      </nav>

      <div key={title} className="mb-8 animate-fade-up motion-reduce:animate-none">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-ink uppercase italic sm:text-5xl">
          {title}
        </h1>
        {collection?.description && <p className="mt-2 text-muted">{collection.description}</p>}
      </div>

      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-40">
            <Filters s={s} brands={brands} />
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              className="flex h-9 items-center gap-2 rounded-full border border-input-border px-4 text-sm font-medium text-ink lg:hidden"
              onClick={() => setDrawer(true)}
            >
              <SlidersHorizontal className="size-4" /> Filters
              {chips.length > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-brand text-[10px] text-brand-foreground">
                  {chips.length}
                </span>
              )}
            </button>
            <p className="text-sm text-muted" aria-live="polite">
              {products ? (
                <>
                  <b className="text-ink">{filtered.length}</b>{" "}
                  {filtered.length === 1 ? "model" : "models"}
                </>
              ) : (
                "Loading…"
              )}
              {isFetching && !isPending && (
                <span className="ml-2 inline-block size-1.5 animate-ping rounded-full bg-brand" />
              )}
            </p>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-muted sm:inline">Sort by</span>
              <select
                value={s.sort}
                onChange={(e) =>
                  s.set({ sort: e.target.value === "newest" ? null : e.target.value })
                }
                className="h-9 cursor-pointer rounded-full border border-input-border bg-background px-3 font-medium text-ink outline-none focus:border-ink"
              >
                {Object.entries(SORTS).map(([k, { label }]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.clear}
                  className="flex h-8 animate-pop items-center gap-1.5 rounded-full bg-brand/25 px-3 text-xs font-medium text-ink motion-reduce:animate-none"
                >
                  {c.label} <X className="size-3.5" />
                </button>
              ))}
              <button
                onClick={() => s.set({ q: null, brand: null, min: null, max: null, stock: null })}
                className="px-2 text-xs font-semibold text-muted underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {isError ? (
            <Empty
              icon={SearchX}
              title="Couldn't load cars"
              text="Please check your connection and refresh."
            />
          ) : isPending ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl bg-surface" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-surface" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            chips.length === 0 ? (
              <Empty
                icon={PackageOpen}
                title="New castings on the way"
                text="We're stocking up this shelf. Check back soon!"
              />
            ) : (
              <Empty
                icon={SearchX}
                title="No cars found"
                text="Try removing a filter or searching for something else."
                action={
                  <button
                    className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-background"
                    onClick={() =>
                      s.set({ q: null, brand: null, min: null, max: null, stock: null })
                    }
                  >
                    Reset filters
                  </button>
                }
              />
            )
          ) : (
            <ul
              className={cn(
                "grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity md:grid-cols-3 lg:gap-x-6",
                isFetching && "opacity-60",
              )}
            >
              {visible.map((p) => (
                <li key={p.slug} className="animate-fade-up motion-reduce:animate-none">
                  <ProductCard
                    product={p}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={page}
            pages={pages}
            onChange={(p) => {
              s.set({ page: p });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/40"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-sm animate-slide-in flex-col bg-background">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="font-semibold text-ink">Filters</p>
              <button onClick={() => setDrawer(false)} aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <Filters s={s} brands={brands} />
            </div>
            <div className="border-t border-border p-4">
              <button
                onClick={() => setDrawer(false)}
                className="h-12 w-full rounded-full bg-ink font-semibold text-background"
              >
                Show {filtered.length} models
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-surface">
        <Icon className="size-9 text-ink" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
