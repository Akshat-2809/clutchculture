"use client";

import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { getCartSummary } from "@/lib/cart";
import { useProductsBySlugs } from "@/lib/use-products";
import { formatPrice } from "@/lib/utils";
import { MAX_QTY_PER_ITEM, useCart, useCartHydrated } from "@/store/cart";
import { OrderSummary } from "./OrderSummary";

export function GarageView() {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const products = useProductsBySlugs(items.map((i) => i.slug));

  if (!hydrated || (items.length > 0 && !products.data)) {
    if (products.isError) {
      return <Alert>We couldn&apos;t load your garage. Please refresh the page.</Alert>;
    }
    return <GarageSkeleton />;
  }

  const { lines, subtotal, savings, itemCount, unavailable } = getCartSummary(
    items,
    products.data ?? new Map(),
  );

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-surface">
          <ShoppingCart className="size-9 text-ink" strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-ink">Your garage is empty</h2>
        <p className="mt-2 max-w-sm text-muted">
          Fresh mainlines, premium sets and Treasure Hunts are waiting.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-background transition hover:bg-ink/85"
        >
          Start collecting <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div>
        {unavailable.length > 0 && (
          <Alert className="mb-4">
            Stock changed since you added these:{" "}
            {unavailable
              .map((l) =>
                l.product.stock <= 0
                  ? `${l.product.name} is sold out`
                  : `only ${l.product.stock} left of ${l.product.name}`,
              )
              .join("; ")}
            . Update your garage to check out.
          </Alert>
        )}

        <ul className="divide-y divide-border border-y border-border">
          {lines.map(({ product, qty, lineTotal }) => {
            const soldOut = product.stock <= 0;
            const href = `/product/${product.slug}`;
            return (
              <li key={product.slug} className="flex gap-4 py-5 sm:gap-6">
                <Link
                  href={href}
                  className="relative size-24 shrink-0 overflow-hidden bg-surface sm:size-32"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="128px"
                    className={soldOut ? "object-cover opacity-50" : "object-cover"}
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs tracking-wide text-muted uppercase">{product.brand}</p>
                      <Link
                        href={href}
                        className="mt-0.5 line-clamp-2 text-base leading-snug text-ink hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {formatPrice(product.price)} each · {product.scale}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-semibold text-ink">
                      {formatPrice(lineTotal)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                    {soldOut ? (
                      <span className="text-sm font-medium text-sale">Sold out</span>
                    ) : (
                      <QuantityStepper
                        size="sm"
                        value={Math.min(qty, product.stock)}
                        max={Math.min(product.stock, MAX_QTY_PER_ITEM)}
                        onChange={(q) => setQty(product.slug, q)}
                        label={`quantity of ${product.name}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => remove(product.slug)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-sale"
                    >
                      <Trash2 className="size-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-ink underline underline-offset-2"
        >
          Continue shopping
        </Link>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <OrderSummary subtotal={subtotal} savings={savings} itemCount={itemCount}>
          {unavailable.length > 0 ? (
            <span className="flex h-13 w-full cursor-not-allowed items-center justify-center rounded-full bg-ink/20 font-semibold text-background">
              Checkout
            </span>
          ) : (
            <Link
              href="/checkout"
              className="group flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-background transition hover:bg-ink/85"
            >
              Checkout
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </OrderSummary>
      </div>
    </div>
  );
}

function GarageSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div className="space-y-5">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-6">
            <div className="size-32 bg-surface" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-3 w-20 rounded bg-surface" />
              <div className="h-4 w-3/4 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-surface" />
    </div>
  );
}
