import type { TransactionSql } from "postgres";
import { badRequest, conflict } from "../lib/httpError.js";

// Stock lifecycle (all inside the caller's transaction):
//   order placed   → reserve:   reserved_qty += n          (held, not sold)
//   payment ok     → commit:    stock_qty -= n, reserved_qty -= n   + movement "order"
//   payment failed / timed out → release: reserved_qty -= n
//   paid order cancelled       → restock: stock_qty += n   + movement "cancel"
// Each update checks availability in its WHERE clause, so concurrent buyers
// can't oversell: the second update simply matches no row.

export type Tx = TransactionSql;
export type StockLine = { variantId: string; qty: number; name: string };

export async function reserve(tx: Tx, lines: StockLine[]) {
  for (const l of lines) {
    const rows = await tx`
      update product_variants set reserved_qty = reserved_qty + ${l.qty}
      where id = ${l.variantId} and is_active and stock_qty - reserved_qty >= ${l.qty}
      returning id
    `;
    if (!rows.length) throw conflict(`Not enough stock for "${l.name}"`);
  }
}

export async function commit(tx: Tx, lines: StockLine[], orderId: string) {
  for (const l of lines) {
    await tx`
      update product_variants
      set stock_qty = stock_qty - ${l.qty}, reserved_qty = greatest(reserved_qty - ${l.qty}, 0)
      where id = ${l.variantId}
    `;
    await logMovement(tx, l.variantId, -l.qty, "order", { orderId });
  }
}

export async function release(tx: Tx, lines: StockLine[]) {
  for (const l of lines) {
    await tx`
      update product_variants set reserved_qty = greatest(reserved_qty - ${l.qty}, 0)
      where id = ${l.variantId}
    `;
  }
}

/** Sell straight from free stock (payment arrived after the hold expired). */
export async function deductIfAvailable(tx: Tx, lines: StockLine[], orderId: string) {
  let allOk = true;
  for (const l of lines) {
    const rows = await tx`
      update product_variants set stock_qty = stock_qty - ${l.qty}
      where id = ${l.variantId} and stock_qty - reserved_qty >= ${l.qty}
      returning id
    `;
    if (rows.length) await logMovement(tx, l.variantId, -l.qty, "order", { orderId });
    else allOk = false;
  }
  return allOk;
}

export async function restock(tx: Tx, lines: StockLine[], orderId: string) {
  for (const l of lines) {
    await tx`update product_variants set stock_qty = stock_qty + ${l.qty} where id = ${l.variantId}`;
    await logMovement(tx, l.variantId, l.qty, "cancel", { orderId });
  }
}

/** Admin sets an absolute stock count; the difference is logged. */
export async function setStock(
  tx: Tx,
  variantId: string,
  newQty: number,
  opts: { note?: string; userId?: string } = {},
) {
  const [v] = await tx<{ stockQty: number; reservedQty: number }[]>`
    select stock_qty as "stockQty", reserved_qty as "reservedQty"
    from product_variants where id = ${variantId} for update
  `;
  if (!v) throw badRequest("Variant not found");
  if (newQty === v.stockQty) return;
  if (newQty < v.reservedQty) {
    throw badRequest(
      `${v.reservedQty} unit(s) are held by orders awaiting payment; stock can't go below that`,
    );
  }
  await tx`update product_variants set stock_qty = ${newQty} where id = ${variantId}`;
  const change = newQty - v.stockQty;
  await logMovement(tx, variantId, change, change > 0 ? "restock" : "manual", opts);
}

export async function logMovement(
  tx: Tx,
  variantId: string,
  change: number,
  reason: "order" | "cancel" | "restock" | "manual" | "return",
  { orderId, note, userId }: { orderId?: string; note?: string; userId?: string } = {},
) {
  await tx`
    insert into inventory_movements (variant_id, change, reason, order_id, note, created_by)
    values (${variantId}, ${change}, ${reason}, ${orderId ?? null}, ${note ?? null}, ${userId ?? null})
  `;
}
