"use client";

import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

type MyOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

const LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Being packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
  refunded: "Refunded",
};

/** Orders placed while signed in (guest orders aren't linked to an account). */
export function OrdersList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api<MyOrder[]>("/orders", { auth: true }),
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sale">Couldn&apos;t load your orders. Please refresh.</p>;
  if (!data.length) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-surface">
          <Package className="size-9 text-ink" strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-ink">No orders yet</h2>
        <p className="mt-2 text-muted">Orders you place while logged in show up here.</p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-7 font-semibold text-background"
        >
          Start collecting
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border">
      {data.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold text-ink">{o.orderNumber}</p>
            <p className="text-sm text-muted">
              {new Date(o.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="rounded-full bg-input px-3 py-1 text-xs font-semibold text-ink">
            {LABEL[o.status] ?? o.status}
          </span>
          <p className="font-semibold text-ink">{formatPrice(o.total)}</p>
        </li>
      ))}
    </ul>
  );
}
