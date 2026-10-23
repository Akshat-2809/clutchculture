import type { Metadata } from "next";
import { Mail, Package } from "lucide-react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Clutch Culture.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Help</p>
      <h1 className="mt-2 font-headline text-4xl font-extrabold tracking-tight text-ink uppercase italic sm:text-5xl">
        Contact us
      </h1>
      <p className="mt-4 text-lg text-muted">
        Questions about an order, a casting you&apos;re hunting, or bulk buys? We&apos;d love to
        hear from you.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex h-full flex-col rounded-2xl border border-border p-6 transition hover:-translate-y-1 hover:border-ink"
          >
            <Mail className="size-6 text-accent" strokeWidth={1.75} />
            <span className="mt-4 font-semibold text-ink">Email</span>
            <span className="mt-1 text-sm text-muted">{SUPPORT_EMAIL}</span>
          </a>
        </li>
        <li>
          <Link
            href="/account/orders"
            className="flex h-full flex-col rounded-2xl border border-border p-6 transition hover:-translate-y-1 hover:border-ink"
          >
            <Package className="size-6 text-accent" strokeWidth={1.75} />
            <span className="mt-4 font-semibold text-ink">Track an order</span>
            <span className="mt-1 text-sm text-muted">See status and tracking in My orders</span>
          </Link>
        </li>
      </ul>
      <p className="mt-8 text-sm text-muted">
        Include your order number (starts with CC-) if your message is about an order.
      </p>
    </section>
  );
}
