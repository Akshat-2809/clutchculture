import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/catalog";

/** Home "Trending now" grid: admin-flagged cars, best sellers of the last 30 days first. */
export function TrendingGrid({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mb-8 flex reveal-on-scroll items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            <Flame className="size-4 fill-accent" /> Hot right now
          </p>
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">Trending now</h2>
        </div>
        <Link
          href="/shop?trending=1"
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-ink"
        >
          <span className="link-underline">View all</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
        {products.slice(0, 10).map((p, i) => (
          <li
            key={p.slug}
            className="reveal-on-scroll"
            style={{ animationDelay: `${(i % 5) * 60}ms` }}
          >
            <ProductCard
              product={p}
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
