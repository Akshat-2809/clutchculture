"use client";

import { ArrowRight, BadgeCheck, Check, PackageCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { fallbackCollections } from "@/lib/navigation";
import { useCollections } from "@/lib/use-products";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const TRUST = [
  { icon: PackageCheck, text: "Packed card-safe, every order" },
  { icon: BadgeCheck, text: "Checked by hand before it ships" },
  { icon: ShieldCheck, text: "Secure payments via Razorpay" },
];

const STATIC_COLS = [
  {
    title: "Account",
    links: [
      ["My account", "/account"],
      ["My orders", "/account/orders"],
      ["Wishlist", "/wishlist"],
      ["Garage", "/garage"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Shipping", "/shipping"],
      ["Returns", "/returns"],
      ["Contact us", "/contact"],
      ["FAQs", "/faq"],
    ],
  },
] as const;

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <p className="mt-6 flex max-w-sm animate-fade-up items-center gap-2 rounded-full bg-in-stock/10 px-4 py-3 text-sm font-medium text-in-stock motion-reduce:animate-none">
        <Check className="size-4" /> You&apos;re on the list — new drops land in your inbox.
      </p>
    );
  }
  return (
    <form
      id="newsletter"
      className="mt-6 max-w-sm scroll-mt-40"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        try {
          await api("/newsletter", { method: "POST", body: { email } });
          setState("done");
        } catch (err) {
          setError(
            err instanceof ApiError && err.status === 400
              ? "Enter a valid email address"
              : "Couldn't sign you up. Please try again.",
          );
          setState("error");
        }
      }}
    >
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email for new drops"
          aria-label="Email for new drops"
          className="h-11 w-full rounded-full border border-input-border bg-background px-4 text-sm text-ink outline-none placeholder:text-placeholder focus:border-ink/40"
        />
        <button
          disabled={state === "sending"}
          aria-label="Sign up"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-background transition hover:bg-ink/85 active:scale-90 disabled:opacity-60"
        >
          <ArrowRight className="size-[18px]" />
        </button>
      </div>
      {state === "error" && <p className="mt-2 px-4 text-xs text-sale">{error}</p>}
    </form>
  );
}

export function Footer({ year }: { year: React.ReactNode }) {
  const { data: collections = fallbackCollections } = useCollections();
  const cols = [
    {
      title: "Shop",
      links: [
        ["All cars", "/shop"],
        ["Trending", "/shop?trending=1"],
        ...collections.map((c) => [c.name, `/collections/${c.slug}`] as const),
        ["Today's Deals", "/shop?sort=savings"],
      ],
    },
    ...STATIC_COLS,
  ];

  return (
    <footer className="mt-12">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10">
        <ul className="flex flex-col items-center justify-center gap-4 rounded-full border border-border px-6 py-5 text-sm text-ink/80 max-md:rounded-3xl md:flex-row md:gap-10">
          {TRUST.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2">
              <Icon className="size-[18px] text-accent" strokeWidth={1.75} /> {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border bg-surface/60">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:px-10">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Hand-checked die-cast — mainlines, premium sets and Treasure Hunts — packed card-safe
              and shipped across India.
            </p>
            <Newsletter />
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="mb-4 text-sm font-semibold text-ink">{c.title}</h4>
                <ul className="space-y-3">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className={cn(
                          "link-underline text-sm text-muted transition hover:text-ink",
                          label === "Today's Deals" &&
                            "font-semibold text-accent hover:text-accent",
                        )}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6 lg:px-10">
            <p>© {year} Clutch Culture. All rights reserved.</p>
            <p className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/terms" className="link-underline hover:text-ink">
                Terms
              </Link>
              <span>·</span>
              <Link href="/privacy" className="link-underline hover:text-ink">
                Privacy
              </Link>
              <span>·</span>
              <span>UPI · Cards · Net banking</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
