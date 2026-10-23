"use client";

import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, Search, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/utils";

const POPULAR = ["Mustang", "Mercedes", "Treasure Hunt", "JDM", "Beetle", "Ferrari"];

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** ⌘K search dialog with live product suggestions. */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const term = useDebounced(q.trim());
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["suggest", term],
    queryFn: () => api<Product[]>(`/products?q=${encodeURIComponent(term)}`),
    enabled: term.length > 1,
    staleTime: 60_000,
    select: (list) => list.slice(0, 6),
  });

  const close = () => {
    onClose();
    setQ("");
    setActive(0);
  };
  const goSearch = (text: string) => {
    router.push(`/shop?q=${encodeURIComponent(text)}`);
    close();
  };
  const goProduct = (p: Product) => {
    router.push(`/product/${p.slug}`);
    close();
  };

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter" && q.trim()) {
      const picked = active > 0 ? results[active - 1] : undefined;
      if (picked) goProduct(picked);
      else goSearch(q.trim());
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-center p-3 pt-[10vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm"
        onClick={close}
      />
      <div
        role="dialog"
        aria-label="Search"
        className="relative h-fit w-full max-w-2xl animate-fade-up overflow-hidden rounded-3xl border border-border bg-background shadow-2xl motion-reduce:animate-none"
      >
        <div className="flex items-center gap-3 border-b border-border px-5">
          <Search
            className={cn("size-5 shrink-0 text-muted", isFetching && "animate-pulse text-ink")}
          />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder="Search castings, brands, series…"
            aria-label="Search"
            className="h-16 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-placeholder"
          />
          <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {term.length < 2 ? (
            <div className="p-3">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
                <TrendingUp className="size-3.5" /> Popular
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((t) => (
                  <button
                    key={t}
                    onClick={() => goSearch(t)}
                    className="h-9 rounded-full border border-input-border px-4 text-sm text-ink transition hover:border-ink"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul>
              <li>
                <button
                  onClick={() => goSearch(q.trim())}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm",
                    active === 0 ? "bg-input" : "hover:bg-input",
                  )}
                >
                  <Search className="size-4 text-muted" />
                  <span className="flex-1">
                    Search for <b>&ldquo;{q.trim()}&rdquo;</b>
                  </span>
                  <CornerDownLeft className="size-4 text-muted" />
                </button>
              </li>
              {results.map((p, i) => (
                <li key={p.slug}>
                  <button
                    onClick={() => goProduct(p)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left",
                      active === i + 1 ? "bg-input" : "hover:bg-input",
                    )}
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface">
                      {p.image && (
                        <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                      <span className="text-xs text-muted">{p.brand}</span>
                    </span>
                    <span className="text-sm font-semibold text-price">{formatPrice(p.price)}</span>
                  </button>
                </li>
              ))}
              {!isFetching && results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">No matching cars</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
