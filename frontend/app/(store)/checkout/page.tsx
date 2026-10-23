import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <h1 className="mb-8 font-headline text-4xl font-extrabold tracking-tight uppercase italic sm:text-5xl">
        Checkout
      </h1>
      <CheckoutView />
    </section>
  );
}
