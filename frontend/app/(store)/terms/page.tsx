import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

// TODO(client): have these reviewed and add business name, address and GSTIN.
export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of use"
      intro="By using clutchculture.in and placing an order, you agree to these terms."
      sections={[
        {
          heading: "Orders & pricing",
          body: (
            <p>
              Prices are in Indian Rupees and include GST. An order is confirmed only once payment
              succeeds. If a car sells out before your payment completes, we&apos;ll refund you in
              full.
            </p>
          ),
        },
        {
          heading: "Product photos",
          body: (
            <p>
              We show each model as accurately as we can; small differences in colour or card art
              between production runs can happen.
            </p>
          ),
        },
        {
          heading: "Shipping & returns",
          body: (
            <p>
              See our <Link href="/shipping">Shipping</Link> and{" "}
              <Link href="/returns">Returns</Link> pages.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
