"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { useProductsBySlugs } from "@/lib/use-products";
import { useRecent } from "@/store/recent";

const arrow =
  "grid size-10 place-items-center rounded-full border border-border text-ink transition hover:bg-ink hover:text-background";

/**
 * "Pick up where you left off" rail (like Nirmal Mart): cars this visitor opened
 * recently, newest first, kept in their browser with live prices and stock.
 */
export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const slugs = useRecent((s) => s.slugs).filter((s) => s !== exclude);
  const { data } = useProductsBySlugs(slugs);
  // Keep viewing order and drop products that no longer exist.
  const products = slugs.flatMap((s) => data?.get(s) ?? []);
  if (!products.length) return null;

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mb-8 flex reveal-on-scroll items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Pick up where you left off
          </p>
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Recently viewed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="group mr-2 hidden items-center gap-1 text-sm font-semibold text-ink sm:flex"
          >
            <span className="link-underline">View all</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button className={arrow} onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft className="size-[18px]" />
          </button>
          <button className={arrow} onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight className="size-[18px]" />
          </button>
        </div>
      </div>

      <ul
        ref={track}
        className="-mx-4 scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:px-0"
      >
        {products.map((p) => (
          <li
            key={p.slug}
            className="w-[46%] shrink-0 animate-fade-up snap-start motion-reduce:animate-none sm:w-[30%] lg:w-[calc((100%-3*1.25rem)/4)]"
          >
            <ProductCard
              product={p}
              sizes="(min-width: 1024px) 23vw, (min-width: 640px) 30vw, 46vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
