import type { Product } from "@/lib/catalog";
import type { CartItem } from "@/store/cart";

export type CartLine = { product: Product; qty: number; lineTotal: number };

/**
 * Joins cart items with live catalogue data. Items whose product no longer
 * exists are dropped. These totals are for display only — the server
 * recalculates prices and checks stock when the order is placed.
 */
export function getCartSummary(items: CartItem[], products: Map<string, Product>) {
  const lines: CartLine[] = items.flatMap(({ slug, qty }) => {
    const product = products.get(slug);
    return product ? [{ product, qty, lineTotal: product.price * qty }] : [];
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const savings = lines.reduce(
    (sum, l) =>
      sum +
      (l.product.compareAtPrice && l.product.compareAtPrice > l.product.price
        ? (l.product.compareAtPrice - l.product.price) * l.qty
        : 0),
    0,
  );
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const unavailable = lines.filter((l) => l.product.stock < l.qty);

  return { lines, subtotal, savings, itemCount, unavailable };
}
