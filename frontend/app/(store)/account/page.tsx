import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountOverview } from "@/components/account/AccountOverview";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

// Signed-out visitors are redirected to /login by proxy.ts.
export default function AccountPage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <Suspense>
        <AccountOverview />
      </Suspense>
    </section>
  );
}
