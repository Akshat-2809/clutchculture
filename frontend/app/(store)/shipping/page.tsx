import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping",
  description: "How Clutch Culture packs and ships your cars.",
};

// TODO(client): add delivery timelines, shipping fee / free-shipping threshold and couriers.
export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Shipping"
      intro="Every car is checked by hand and packed card-safe, so it arrives the way it left our shelf."
      sections={[
        {
          heading: "Where we ship",
          body: <p>We ship across India.</p>,
        },
        {
          heading: "Packing",
          body: (
            <p>
              Carded cars travel in protective packaging so blisters and cards don&apos;t get
              crushed or bent. Premium and big-scale models are boxed with extra padding.
            </p>
          ),
        },
        {
          heading: "Shipping charges & delivery time",
          body: (
            <p>
              The shipping charge (if any) is shown at checkout before you pay. Once your order
              ships, the courier name and tracking number are added to your order.
            </p>
          ),
        },
        {
          heading: "Tracking your order",
          body: (
            <p>
              If you ordered while logged in, see <Link href="/account/orders">My orders</Link>.
              Otherwise email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your
              order number (it starts with CC-).
            </p>
          ),
        },
      ]}
    />
  );
}
