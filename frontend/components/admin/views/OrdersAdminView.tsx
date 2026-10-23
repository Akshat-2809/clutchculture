"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Card,
  Drawer,
  PageHead,
  Skeleton,
  StatusBadge,
  btn,
  dateTime,
  errorMessage,
  inputClass,
  statusLabel,
  toast,
} from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";
import { cn, formatPrice } from "@/lib/utils";

const TABS = [
  ["", "All"],
  ["pending_payment", "Awaiting payment"],
  ["confirmed", "Confirmed"],
  ["processing", "Processing"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
] as const;

const ACTION_LABEL: Record<string, string> = {
  processing: "Start processing",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};

function OrderDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: order } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => adminApi.order(id!),
    enabled: !!id,
  });
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      adminApi.setOrderStatus(id!, {
        status,
        trackingNumber: tracking || undefined,
        courier: courier || undefined,
      }),
    onSuccess: (_, status) => {
      toast.success(`Order ${statusLabel(status).toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["admin"] });
      setTracking("");
      setCourier("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const a = order?.shippingAddress;
  const actions = order?.nextStatuses ?? [];
  const canShip = actions.includes("shipped");

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={order?.orderNumber ?? "Order"}
      footer={
        actions.length > 0 && (
          <div className="space-y-3">
            {canShip && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputClass}
                  placeholder="Courier (optional)"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Tracking no. (optional)"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {actions.map((s) => (
                <button
                  key={s}
                  disabled={setStatus.isPending}
                  onClick={() => {
                    if (
                      s === "cancelled" &&
                      !window.confirm(
                        order?.paymentStatus === "paid"
                          ? "Cancel this paid order? Its items go back into stock. Refund the customer from the Razorpay dashboard."
                          : "Cancel this order and release its held stock?",
                      )
                    )
                      return;
                    setStatus.mutate(s);
                  }}
                  className={cn(
                    s === "cancelled" ? cn(btn.outline, "text-sale") : cn(btn.primary, "flex-1"),
                  )}
                >
                  {ACTION_LABEL[s] ?? statusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        )
      }
    >
      {!order ? (
        <div className="space-y-3 p-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-6 p-6 text-sm">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
          {order.notes && (
            <p className="rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">
              {order.notes}
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs tracking-wider text-muted uppercase">Customer</p>
              <p className="mt-1 font-semibold text-ink">{a?.fullName}</p>
              <p className="text-muted">{order.email}</p>
              <p className="text-muted">+91 {order.phone}</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-muted uppercase">Ship to</p>
              <p className="mt-1 text-ink">
                {a?.line1}
                {a?.line2 && `, ${a.line2}`}
                {a?.landmark && (
                  <>
                    <br />
                    Near {a.landmark}
                  </>
                )}
                <br />
                {a?.city}, {a?.state} – {a?.pincode}
              </p>
            </div>
          </div>
          {(order.trackingNumber || order.courier) && (
            <p className="text-ink">
              <span className="text-muted">Tracking:</span> {order.courier} {order.trackingNumber}
            </p>
          )}

          <ul className="divide-y divide-border rounded-2xl border border-border">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 p-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {i.image && (
                    <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-ink">{i.productName}</span>
                  <span className="text-xs text-muted">
                    {i.sku} · {i.qty} × {formatPrice(i.unitPrice)}
                  </span>
                </span>
                <b className="text-ink">{formatPrice(i.lineTotal)}</b>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-muted">Items</dt>
              <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-ink">
                {order.shippingFee ? formatPrice(order.shippingFee) : "Free"}
              </dd>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <dt>GST included</dt>
              <dd>{formatPrice(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-3 text-xs tracking-wider text-muted uppercase">Timeline</p>
            <ol className="space-y-3 border-l-2 border-border pl-4">
              {order.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-chart ring-2 ring-background" />
                  <p className="font-medium text-ink">{statusLabel(h.to)}</p>
                  <p className="text-xs text-muted">
                    {dateTime(h.createdAt)}
                    {h.by && ` · ${h.by}`}
                  </p>
                  {h.note && <p className="mt-0.5 text-xs text-muted">{h.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function OrdersView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get("status") ?? "";
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["admin", "orders", status, q, page],
    queryFn: () => adminApi.orders({ status: status || undefined, q: q || undefined, page }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHead title="Orders" subtitle={data ? `${data.total} orders` : " "} />

      <div className="mb-4 scrollbar-none flex gap-1 overflow-x-auto">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              router.push(value ? `${pathname}?status=${value}` : pathname);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              status === value ? "bg-ink text-background" : "text-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          className={cn(inputClass, "pl-10")}
          placeholder="Order number, name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={cn("transition-opacity", isFetching && !isPending && "opacity-60")}>
        {/* Mobile: cards */}
        <div className="space-y-2 md:hidden">
          {isPending ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)
          ) : data!.items.length === 0 ? (
            <p className="py-12 text-center text-muted">No orders found</p>
          ) : (
            data!.items.map((o) => (
              <button
                key={o.id}
                onClick={() => setOpen(o.id)}
                className="w-full rounded-2xl border border-border p-4 text-left active:bg-input"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{o.orderNumber}</p>
                    <p className="truncate text-xs text-muted">
                      {o.customerName} · {dateTime(o.createdAt)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-ink">{formatPrice(o.total)}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <StatusBadge status={o.status} />
                  <StatusBadge status={o.paymentStatus} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Tablet & desktop: table */}
        <Card className="hidden overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-input/60 text-left text-xs tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-8" />
                      </td>
                    </tr>
                  ))
                ) : data!.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  data!.items.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setOpen(o.id)}
                      className="cursor-pointer transition hover:bg-input/50"
                    >
                      <td className="px-4 py-3 font-semibold text-ink">
                        {o.orderNumber}
                        <span className="block text-xs font-normal text-muted">
                          {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {o.customerName}
                        <span className="block text-xs text-muted">{o.email}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{dateTime(o.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.paymentStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {data && data.pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {data.pages}
          </span>
          <div className="flex gap-1">
            <button
              className={btn.icon}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              className={btn.icon}
              disabled={page === data.pages}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <OrderDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function OrdersAdminView() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
