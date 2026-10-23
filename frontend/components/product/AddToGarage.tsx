"use client";

import { Check, Loader2, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { flyToCart } from "@/lib/fly-to-cart";
import { MAX_QTY_PER_ITEM, useCart } from "@/store/cart";

export function AddToGarage({ slug, stock }: { slug: string; stock: number }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const max = Math.min(stock, MAX_QTY_PER_ITEM);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(t);
  }, [added]);

  if (stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="h-14 w-full cursor-not-allowed rounded-full bg-input text-base font-semibold text-muted"
      >
        Sold out
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <QuantityStepper value={qty} max={max} onChange={setQty} />
        <button
          type="button"
          onClick={() => {
            add(slug, qty, stock);
            setAdded(true);
            flyToCart(document.querySelector<HTMLElement>("[data-product-image]"));
          }}
          className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-ink text-base font-semibold text-background transition hover:bg-ink/85"
        >
          {added ? (
            <>
              <Check className="size-5" /> Added to Garage
            </>
          ) : (
            <>
              <ShoppingCart className="size-5" /> Add to Garage
            </>
          )}
        </button>
      </div>
      {/* Like Nirmal Mart: add the chosen quantity, then go straight to checkout. */}
      <button
        type="button"
        disabled={buying}
        onClick={() => {
          setBuying(true);
          add(slug, qty, stock);
          router.push("/checkout");
        }}
        className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-brand text-base font-semibold text-brand-foreground shadow-[0_8px_30px_-10px_rgb(239_207_106/0.8)] transition hover:-translate-y-0.5 hover:bg-brand-dark active:scale-[0.98] disabled:opacity-80"
      >
        {buying ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Zap className="size-5 fill-current transition-transform group-hover:scale-110" />
        )}
        Buy now
      </button>
      {added && (
        <p className="text-center text-sm text-muted" role="status">
          <Link href="/garage" className="font-semibold text-ink underline underline-offset-2">
            View your Garage
          </Link>{" "}
          to check out.
        </p>
      )}
    </div>
  );
}
