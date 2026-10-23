import { formatPrice } from "@/lib/utils";

export function OrderSummary({
  subtotal,
  savings,
  itemCount,
  shippingLabel = "Calculated at checkout",
  children,
}: {
  subtotal: number;
  savings: number;
  itemCount: number;
  shippingLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/80">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
        </div>
        {savings > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink/80">You save</dt>
            <dd className="font-medium text-save-foreground">−{formatPrice(savings)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink/80">Shipping</dt>
          {/* TODO: shipping rules pending client decision */}
          <dd className="text-muted">{shippingLabel}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
        <span className="text-base font-semibold text-ink">Total</span>
        <span className="text-2xl font-semibold text-ink">{formatPrice(subtotal)}</span>
      </div>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
