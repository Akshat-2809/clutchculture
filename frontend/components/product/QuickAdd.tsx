"use client";

import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { flyToCart } from "@/lib/fly-to-cart";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

/**
 * Mouse devices: a full-width "Quick add" pill that slides up when the card is
 * hovered (the card needs `group`). Touch devices: a round "+" button that's
 * always visible, since there's no hover.
 */
export function QuickAdd({ slug, name, stock }: { slug: string; name: string; stock: number }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const soldOut = stock <= 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={(e) => {
        add(slug, 1, stock);
        setAdded(true);
        flyToCart(e.currentTarget.closest("article")?.querySelector("img"));
        // Drop focus after a mouse click so the pill hides when the pointer leaves.
        if (e.detail > 0) e.currentTarget.blur();
      }}
      aria-label={soldOut ? `${name} is sold out` : `Quick add ${name} to Garage`}
      className={cn(
        "absolute z-10 flex items-center justify-center overflow-hidden font-semibold shadow-lg transition duration-300 ease-out active:scale-95",
        // Touch: compact round button, bottom-right.
        "right-3 bottom-3 size-11 rounded-full",
        // Mouse: wide pill that slides up from below the image on hover, or when
        // tabbed to with the keyboard (focus-visible, not plain focus, so a clicked
        // card doesn't keep its pill open).
        "pointer-fine:inset-x-3 pointer-fine:h-12 pointer-fine:w-auto pointer-fine:translate-y-[130%] pointer-fine:group-hover:translate-y-0 pointer-fine:group-has-[:focus-visible]:translate-y-0",
        soldOut
          ? "hidden cursor-not-allowed bg-background/90 text-muted backdrop-blur pointer-fine:flex"
          : "bg-brand text-brand-foreground hover:bg-brand-dark",
      )}
    >
      {soldOut ? (
        "Sold out"
      ) : (
        // key re-mounts the label so it slides in on each swap
        <span
          key={added ? "added" : "add"}
          className="flex animate-label-in items-center gap-2 motion-reduce:animate-none"
        >
          {added ? (
            <Check className="size-5" strokeWidth={2.25} />
          ) : (
            <Plus className="size-5" strokeWidth={2.25} />
          )}
          <span className="hidden pointer-fine:inline">{added ? "Added" : "Quick add"}</span>
        </span>
      )}
    </button>
  );
}
