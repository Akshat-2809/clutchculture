"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ApiError, api } from "@/lib/api";
import { getCartSummary } from "@/lib/cart";
import { INDIAN_STATES } from "@/lib/indian-states";
import { openRazorpay } from "@/lib/razorpay";
import { useProductsBySlugs } from "@/lib/use-products";
import { cn, formatPrice } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { useCart, useCartHydrated } from "@/store/cart";

type PlacedOrder = {
  id: string;
  orderNumber: string;
  total: number;
  razorpay: { keyId: string; orderId: string; amount: number } | null;
  testMode: boolean;
};

export function CheckoutView() {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const queryClient = useQueryClient();
  const products = useProductsBySlugs(items.map((i) => i.slug));
  const [error, setError] = useState<string | null>(null);
  // Dev-only: order placed, waiting for the simulated payment.
  const [testOrder, setTestOrder] = useState<PlacedOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phone: "",
      fullName: "",
      line1: "",
      line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  if (confirmed) return <OrderConfirmed orderNumber={confirmed} />;

  if (!hydrated || (items.length > 0 && !products.data)) {
    return <div className="h-96 animate-pulse rounded-2xl bg-surface" />;
  }

  const { lines, subtotal, savings, itemCount, unavailable } = getCartSummary(
    items,
    products.data ?? new Map(),
  );

  // While a test order is pending its own hold lowers stock; don't treat that as sold out.
  if (lines.length === 0 || (unavailable.length > 0 && !testOrder)) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-ink">
          {lines.length === 0
            ? "Your garage is empty."
            : "Stock changed for some items in your garage."}
        </p>
        <Link
          href={lines.length === 0 ? "/" : "/garage"}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-7 font-semibold text-background"
        >
          {lines.length === 0 ? "Start collecting" : "Back to Garage"}
        </Link>
      </div>
    );
  }

  const finish = (orderNumber: string) => {
    clearCart();
    // Stock just changed: refetch product data everywhere.
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setConfirmed(orderNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fail = (err: unknown) => {
    setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    if (err instanceof ApiError && err.status === 409) products.refetch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The server re-prices everything, holds the stock for 15 minutes and (with
  // Razorpay configured) returns a Razorpay order to pay.
  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const order = await api<PlacedOrder>("/orders", {
        method: "POST",
        auth: true,
        body: {
          items: items.map(({ slug, qty }) => ({ slug, qty })),
          email: v.email,
          phone: v.phone,
          address: {
            fullName: v.fullName,
            line1: v.line1,
            line2: v.line2 || undefined,
            landmark: v.landmark || undefined,
            city: v.city,
            state: v.state,
            pincode: v.pincode,
          },
        },
      });

      if (order.testMode) {
        setTestOrder(order);
        return;
      }

      const result = await openRazorpay({
        key: order.razorpay!.keyId,
        order_id: order.razorpay!.orderId,
        amount: order.razorpay!.amount,
        name: "Clutch Culture",
        description: `Order ${order.orderNumber}`,
        prefill: { name: v.fullName, email: v.email, contact: v.phone },
      });
      if (!result) {
        // Closed or failed: release the held stock now instead of after 15 minutes.
        await api("/payments/failed", {
          method: "POST",
          body: { orderNumber: order.orderNumber, razorpay_order_id: order.razorpay!.orderId },
        }).catch(() => {});
        setError("Payment wasn't completed, so no money was taken. You can try again.");
        return;
      }
      await api("/payments/verify", {
        method: "POST",
        body: { orderNumber: order.orderNumber, ...result },
      });
      finish(order.orderNumber);
    } catch (err) {
      fail(err);
    }
  });

  const completeTestPayment = async () => {
    if (!testOrder) return;
    setPaying(true);
    try {
      await api("/payments/test-confirm", {
        method: "POST",
        body: { orderNumber: testOrder.orderNumber },
      });
      finish(testOrder.orderNumber);
    } catch (err) {
      setTestOrder(null);
      fail(err);
    } finally {
      setPaying(false);
    }
  };

  const field = (name: keyof CheckoutInput) => ({
    invalid: !!errors[name],
    ...register(name),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
      <div className="space-y-10">
        {error && <Alert>{error}</Alert>}
        {testOrder && (
          <div className="rounded-2xl border-2 border-dashed border-accent bg-accent/5 p-5">
            <p className="font-semibold text-ink">
              Test mode — order {testOrder.orderNumber} placed
            </p>
            <p className="mt-1 text-sm text-muted">
              Razorpay keys aren&apos;t set yet, so no real payment can be taken. Your items are
              held for 15 minutes. Complete a test payment to confirm the order and deduct stock.
              (This option disappears in production and once Razorpay is connected.)
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="brand" loading={paying} onClick={completeTestPayment}>
                Complete test payment of {formatPrice(testOrder.total)}
              </Button>
              <Button type="button" variant="outline" onClick={() => setTestOrder(null)}>
                Not now
              </Button>
            </div>
          </div>
        )}

        <fieldset className="space-y-5">
          <legend className="mb-5 text-xl font-semibold text-ink">Contact</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...field("email")} />
            </FormField>
            <FormField
              label="Mobile number"
              htmlFor="phone"
              error={errors.phone?.message}
              hint="For delivery updates."
            >
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="pl-14"
                  {...field("phone")}
                />
              </div>
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-5 text-xl font-semibold text-ink">Delivery address</legend>
          <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="name" {...field("fullName")} />
          </FormField>
          <FormField
            label="House / flat, building, street"
            htmlFor="line1"
            error={errors.line1?.message}
          >
            <Input id="line1" autoComplete="address-line1" {...field("line1")} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Area / locality" htmlFor="line2" optional>
              <Input id="line2" autoComplete="address-line2" {...field("line2")} />
            </FormField>
            <FormField label="Landmark" htmlFor="landmark" optional>
              <Input id="landmark" {...field("landmark")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" autoComplete="address-level2" {...field("city")} />
            </FormField>
            <FormField label="State" htmlFor="state" error={errors.state?.message}>
              <select
                id="state"
                autoComplete="address-level1"
                aria-invalid={!!errors.state || undefined}
                className={cn(
                  "h-12 w-full rounded-xl border border-input-border bg-input px-4 text-base text-ink outline-none focus:border-ink/40 focus:bg-background",
                  errors.state && "border-sale",
                )}
                {...register("state")}
              >
                <option value="" disabled>
                  Select
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
              <Input
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                {...field("pincode")}
              />
            </FormField>
          </div>
        </fieldset>
      </div>

      <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          subtotal={subtotal}
          savings={savings}
          itemCount={itemCount}
          shippingLabel="To be confirmed"
        >
          <ul className="mb-6 space-y-3 border-b border-ink/10 pb-6">
            {lines.map(({ product, qty, lineTotal }) => (
              <li key={product.slug} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-background">
                  <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                  <span className="absolute -top-0 -right-0 flex size-5 items-center justify-center rounded-bl-md bg-ink text-[11px] font-semibold text-background">
                    {qty}
                  </span>
                </div>
                <p className="line-clamp-2 flex-1 text-sm text-ink">{product.name}</p>
                <p className="text-sm font-medium text-ink">{formatPrice(lineTotal)}</p>
              </li>
            ))}
          </ul>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!!testOrder}
            className="h-13 w-full"
          >
            <Lock className="size-4" /> Pay {formatPrice(subtotal)}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            Secure payment via Razorpay — UPI, cards, netbanking, wallets.
          </p>
        </OrderSummary>
        <Link
          href="/garage"
          className="block text-center text-sm font-medium text-ink underline underline-offset-2"
        >
          Back to Garage
        </Link>
      </div>
    </form>
  );
}

function OrderConfirmed({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="mx-auto flex max-w-md animate-fade-up flex-col items-center py-12 text-center motion-reduce:animate-none">
      <div className="flex size-20 animate-pop items-center justify-center rounded-full bg-in-stock/15 motion-reduce:animate-none">
        <CircleCheck className="size-10 text-in-stock" strokeWidth={1.75} />
      </div>
      <h2 className="mt-6 text-3xl font-semibold text-ink">Order confirmed!</h2>
      <p className="mt-2 text-muted">
        Thanks for shopping with Clutch Culture. Your order number is{" "}
        <b className="text-ink">{orderNumber}</b>. We&apos;ll pack it card-safe and send it your
        way.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-7 font-semibold text-background transition hover:bg-ink/85"
      >
        Keep shopping
      </Link>
    </div>
  );
}
