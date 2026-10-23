"use client";

import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";
import { cn } from "@/lib/utils";

// ---------- Toasts ----------

type Toast = { id: number; message: string; tone: "success" | "error" };
const useToasts = create<{ list: Toast[]; push: (t: Omit<Toast, "id">) => void }>((set) => ({
  list: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ list: [...s.list, { ...t, id }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((x) => x.id !== id) })), 3500);
  },
}));

export const toast = {
  success: (message: string) => useToasts.getState().push({ message, tone: "success" }),
  error: (message: string) => useToasts.getState().push({ message, tone: "error" }),
};

export function Toaster() {
  const list = useToasts((s) => s.list);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto animate-fade-up rounded-full px-5 py-3 text-sm font-medium shadow-xl motion-reduce:animate-none",
            t.tone === "success" ? "bg-ink text-background" : "bg-sale text-white",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

// ---------- Layout bits ----------

export function PageHead({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-ink uppercase italic">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-background", className)}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface", className)} />;
}

export function Spinner() {
  return <Loader2 className="size-4 animate-spin" />;
}

export const btn = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-background transition hover:bg-ink/85 disabled:opacity-50",
  brand:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-dark disabled:opacity-50",
  outline:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-input-border px-5 text-sm font-semibold text-ink transition hover:bg-input disabled:opacity-50",
  icon: "inline-flex size-9 items-center justify-center rounded-full text-ink/70 transition hover:bg-input hover:text-ink disabled:opacity-40",
};

export const inputClass =
  "h-11 w-full rounded-xl border border-input-border bg-input px-3.5 text-sm text-ink outline-none transition placeholder:text-placeholder focus:border-ink/40 focus:bg-background";
export const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50",
        checked ? "bg-in-stock" : "bg-input-border",
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
  if (!label) return sw;
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-ink">
      <span>{label}</span>
      {sw}
    </div>
  );
}

// ---------- Overlays ----------

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
}

/** Right-side panel (product editor, order detail). */
export function Drawer({
  open,
  onClose,
  title,
  footer,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        className={cn(
          "absolute inset-y-0 flex w-full max-w-2xl flex-col bg-background shadow-2xl",
          side === "right" ? "right-0 animate-slide-in-right" : "left-0 max-w-xs animate-slide-in",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className={btn.icon} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        className="relative max-h-[90vh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl motion-reduce:animate-none"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className={btn.icon} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---------- Status badges ----------

const STATUS: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  confirmed: { label: "Confirmed", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  processing: {
    label: "Processing",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  shipped: { label: "Shipped", className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  delivered: { label: "Delivered", className: "bg-in-stock/15 text-in-stock" },
  cancelled: { label: "Cancelled", className: "bg-sale/10 text-sale" },
  payment_failed: { label: "Payment failed", className: "bg-sale/10 text-sale" },
  refunded: { label: "Refunded", className: "bg-input text-muted" },
  // payment_status values
  pending: { label: "Unpaid", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  paid: { label: "Paid", className: "bg-in-stock/15 text-in-stock" },
  failed: { label: "Failed", className: "bg-sale/10 text-sale" },
  partially_refunded: { label: "Part refunded", className: "bg-input text-muted" },
  // product status
  active: { label: "Active", className: "bg-in-stock/15 text-in-stock" },
  draft: { label: "Draft", className: "bg-input text-muted" },
  archived: { label: "Archived", className: "bg-input text-muted" },
};

export const statusLabel = (s: string) => STATUS[s]?.label ?? s;

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: "bg-input text-muted" };
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

export function StockBadge({ available, threshold }: { available: number; threshold: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        available <= 0
          ? "bg-sale/10 text-sale"
          : available <= threshold
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-in-stock/15 text-in-stock",
      )}
    >
      {available <= 0 ? "Sold out" : `${available} in stock`}
    </span>
  );
}

export const dateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
export const date = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
