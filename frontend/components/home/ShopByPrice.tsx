import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

// Rupee bands; links use the shop page's ?min / ?max filters (rupees).
const BUCKETS = [
  { label: "Under ₹299", note: "Pocket-money mainlines", max: 299, tone: "from-brand/40" },
  { label: "Under ₹499", note: "Everyday heroes", max: 499, tone: "from-accent/25" },
  { label: "Under ₹999", note: "Premium & multipacks", max: 999, tone: "from-in-stock/20" },
  { label: "₹1,000 & above", note: "Big-scale & chase cars", min: 1000, tone: "from-ink/10" },
];

export function ShopByPrice({ products }: { products: Product[] }) {
  const buckets = BUCKETS.map((b) => ({
    ...b,
    count: products.filter((p) => (b.max ? p.price <= b.max * 100 : p.price >= b.min! * 100))
      .length,
  })).filter((b) => b.count > 0);
  if (buckets.length < 2) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <h2 className="mb-8 reveal-on-scroll text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Shop by price
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {buckets.map((b, i) => (
          <li key={b.label} className="reveal-on-scroll" style={{ animationDelay: `${i * 70}ms` }}>
            <Link
              href={b.max ? `/shop?max=${b.max}` : `/shop?min=${b.min}`}
              className={cn(
                "group block h-full rounded-2xl border border-border bg-linear-to-br to-transparent p-5 transition hover:-translate-y-1 hover:shadow-lg sm:p-6",
                b.tone,
              )}
            >
              <p className="font-headline text-xl font-extrabold tracking-tight text-ink uppercase italic sm:text-3xl">
                {b.label}
              </p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{b.note}</p>
              <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink">
                {b.count} {b.count === 1 ? "model" : "models"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
