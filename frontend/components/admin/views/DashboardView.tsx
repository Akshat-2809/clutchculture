"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, IndianRupee, Package, ShoppingCart, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import {
  Card,
  PageHead,
  Skeleton,
  StatusBadge,
  dateTime,
  statusLabel,
} from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";
import { cn, formatPrice } from "@/lib/utils";

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "alert";
}) {
  return (
    <Card className="p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            tone === "alert" ? "bg-sale/10 text-sale" : "bg-brand/25 text-ink",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

/** Horizontal single-hue bar row: label + value as text, bar for magnitude. */
function BarRow({
  label,
  value,
  share,
  sub,
}: {
  label: React.ReactNode;
  value: string;
  share: number;
  sub?: string;
}) {
  return (
    <li className="text-sm">
      <div className="flex justify-between gap-2">
        <span className="truncate text-ink">{label}</span>
        <b className="shrink-0 text-ink">{value}</b>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-input">
        <div
          className="h-full rounded-full bg-chart transition-[width] duration-700"
          style={{ width: `${Math.max(share * 100, 2)}%` }}
        />
      </div>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </li>
  );
}

const RANGES = [7, 30, 90];

export function DashboardView() {
  const [days, setDays] = useState(30);
  const { data, isPending, isFetching } = useQuery({
    queryKey: ["admin", "stats", days],
    queryFn: () => adminApi.stats(days),
    placeholderData: keepPreviousData,
  });

  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }
  const s = data.stats;
  const maxStatus = Math.max(...data.byStatus.map((b) => b.count), 1);
  const maxTop = data.top[0]?.revenue || 1;

  return (
    <div className={cn("transition-opacity", isFetching && "opacity-60")}>
      <PageHead title="Dashboard" subtitle={`Overview for the last ${days} days`}>
        <div className="flex rounded-full border border-border p-1">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                days === d ? "bg-ink text-background" : "text-muted hover:text-ink",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </PageHead>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={IndianRupee}
          label="Revenue"
          value={formatPrice(s.periodRevenue)}
          hint={`${formatPrice(s.totalRevenue)} all time`}
        />
        <Stat
          icon={ShoppingCart}
          label="Paid orders"
          value={s.periodOrders.toLocaleString("en-IN")}
          hint={`${s.toFulfil} to pack & ship · ${s.awaitingPayment} awaiting payment`}
        />
        <Stat
          icon={Users}
          label="Customers"
          value={s.customers.toLocaleString("en-IN")}
          hint="Registered accounts"
        />
        <Stat
          icon={s.lowStockCount ? AlertTriangle : Package}
          label="Low stock"
          value={String(s.lowStockCount)}
          hint={`of ${s.activeProducts} active products`}
          tone={s.lowStockCount ? "alert" : "default"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Revenue per day</h3>
            <p className="text-sm text-muted">{formatPrice(s.periodRevenue)}</p>
          </div>
          <RevenueChart data={data.series} />
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-ink">Orders by status</h3>
          {data.byStatus.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No orders in this period</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.byStatus
                .toSorted((a, b) => b.count - a.count)
                .map((b) => (
                  <BarRow
                    key={b.status}
                    label={
                      <Link href={`/admin/orders?status=${b.status}`} className="hover:underline">
                        {statusLabel(b.status)}
                      </Link>
                    }
                    value={String(b.count)}
                    share={b.count / maxStatus}
                  />
                ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Recent orders</h3>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No orders yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{o.orderNumber}</p>
                    <p className="truncate text-xs text-muted">
                      {o.customer} · {dateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-semibold text-ink">{formatPrice(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">Top products</h3>
          {data.top.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No sales in this period</p>
          ) : (
            <ul className="space-y-4">
              {data.top.map((p) => (
                <BarRow
                  key={p.name}
                  label={p.name}
                  value={formatPrice(p.revenue)}
                  share={p.revenue / maxTop}
                  sub={`${p.units} sold`}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Low stock</h3>
            <Link
              href="/admin/products?stock=low"
              className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
            >
              Manage
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Everything is well stocked</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {p.image && (
                      <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      p.available <= 0
                        ? "bg-sale/10 text-sale"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {p.available <= 0 ? "Sold out" : `${p.available} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.topCustomers.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 font-semibold text-ink">Top customers</h3>
              <ul className="space-y-2">
                {data.topCustomers.map((c) => (
                  <li key={c.email} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-ink">
                      {c.name} <span className="text-xs text-muted">· {c.orders} orders</span>
                    </span>
                    <b className="text-ink">{formatPrice(c.spend)}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
