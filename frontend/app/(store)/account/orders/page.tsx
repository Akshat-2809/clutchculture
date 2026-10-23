import type { Metadata } from "next";
import Link from "next/link";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

// Signed-out visitors are redirected to /login by proxy.ts.
export default function MyOrdersPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/account" className="text-sm text-muted hover:text-ink">
        ← My account
      </Link>
      <h1 className="mt-3 mb-8 font-headline text-4xl font-extrabold tracking-tight text-ink uppercase italic sm:text-5xl">
        My orders
      </h1>
      <OrdersList />
    </section>
  );
}
