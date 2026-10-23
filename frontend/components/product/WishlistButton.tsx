"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/store/wishlist";

export function WishlistButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const saved = useWishlist((s) => s.slugs.includes(slug));
  const toggle = useWishlist((s) => s.toggle);
  // Only animate after a click, not when the saved list loads.
  const [clicked, setClicked] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        toggle(slug);
        setClicked(true);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm backdrop-blur transition hover:scale-110 active:scale-90",
        className,
      )}
    >
      <Heart
        key={String(saved)}
        className={cn(
          "size-5 transition-colors",
          saved && "fill-accent text-accent",
          clicked && saved && "animate-pop motion-reduce:animate-none",
        )}
        strokeWidth={1.75}
      />
      {clicked && saved && (
        <span
          key="ring"
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-ring rounded-full border-2 border-accent motion-reduce:hidden"
        />
      )}
    </button>
  );
}
