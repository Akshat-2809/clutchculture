import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/catalog";

const MAX = 15;

/** Round-robin across collections so the grid shows a mix, not one collection at a time. */
function mix(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const list = groups.get(p.collection) ?? [];
    list.push(p);
    groups.set(p.collection, list);
  }
  const lists = [...groups.values()];
  const out: Product[] = [];
  for (let i = 0; out.length < products.length; i++) {
    for (const list of lists) if (list[i]) out.push(list[i]!);
  }
  return out;
}

/** Home "Explore all products": up to 15 cars, then a button to the full shop. */
export function ExploreAll({ products }: { products: Product[] }) {
  if (!products.length) return null;
  const shown = mix(products).slice(0, MAX);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mb-8 flex reveal-on-scroll items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            The whole garage
          </p>
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Explore all products
          </h2>
        </div>
        <Link
          href="/shop"
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-ink"
        >
          <span className="link-underline">Shop all</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
        {shown.map((p, i) => (
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

      {products.length > MAX && (
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="group inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink px-7 font-semibold text-ink transition hover:bg-ink hover:text-background"
          >
            Show all {products.length} products
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </section>
  );
}
