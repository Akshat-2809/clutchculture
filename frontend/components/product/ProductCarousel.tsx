"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductSummary } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

// Card widths: ~1.4 visible on phones, 2.3 on small tablets, 3 on tablets, 5 on desktop.
const ITEM_WIDTH =
  "w-[70%] sm:w-[calc((100%-1rem*1.3)/2.3)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-6rem)/5)]";
const ITEM_SIZES = "(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 70vw";

export function ProductCarousel({
  title,
  products,
  eyebrow,
  href,
}: {
  title: string;
  products: ProductSummary[];
  /** Small kicker above the title, e.g. "Pick up where you left off". */
  eyebrow?: string;
  /** Adds a "View all" link. */
  href?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateArrows]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowClass =
    "absolute top-[calc((100%-10rem)/2)] z-10 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full border border-ink bg-background/90 text-ink shadow-sm backdrop-blur transition hover:bg-ink hover:text-background md:flex";

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
      <div className="flex reveal-on-scroll items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-ink"
          >
            <span className="link-underline">View all</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Reveal the whole row: per-card view timelines would track the horizontal scroller. */}
      <div className="relative mt-8 reveal-on-scroll">
        <ul
          ref={trackRef}
          onScroll={updateArrows}
          className="-mx-4 scrollbar-none flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:gap-6 lg:px-0"
        >
          {products.map((product) => (
            <li key={product.slug} className={cn("shrink-0 snap-start", ITEM_WIDTH)}>
              <ProductCard product={product} sizes={ITEM_SIZES} />
            </li>
          ))}
        </ul>

        {canPrev && (
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Previous products"
            className={cn(arrowClass, "-left-3 lg:-left-7")}
          >
            <ChevronLeft className="size-6" strokeWidth={1.5} />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Next products"
            className={cn(arrowClass, "-right-3 lg:-right-7")}
          >
            <ChevronRight className="size-6" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </section>
  );
}
