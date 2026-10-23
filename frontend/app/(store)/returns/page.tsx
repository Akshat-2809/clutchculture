import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns",
  description: "Returns and refunds at Clutch Culture.",
};

// TODO(client): set the return window, eligible items and who pays return shipping.
export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Returns"
      intro="If something isn't right with your order, we'll make it right."
      sections={[
        {
          heading: "Damaged or wrong item",
          body: (
            <p>
              Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order number
              and photos of the item and packaging as soon as your parcel arrives. We&apos;ll sort
              out a replacement or refund.
            </p>
          ),
        },
        {
          heading: "Cancelling an order",
          body: (
            <p>
              Orders can be cancelled before they ship — email us with your order number. Once a
              paid order is cancelled the cars go back into stock and your payment is refunded.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <p>
              Refunds go back to the original payment method (UPI, card or net banking) through
              Razorpay. Your bank may take a few working days to show it.
            </p>
          ),
        },
      ]}
    />
  );
}
