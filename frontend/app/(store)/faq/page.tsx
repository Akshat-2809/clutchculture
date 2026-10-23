import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to common questions about Clutch Culture.",
};

const QA: [string, React.ReactNode][] = [
  [
    "Are the cars new and original?",
    <>Yes — every car is checked by hand before it ships and packed card-safe.</>,
  ],
  [
    "What does “Only 2 left” mean?",
    <>
      It&apos;s the live number you can still buy. Stock updates the moment someone pays, so what
      you see is what&apos;s on the shelf.
    </>,
  ],
  [
    "I added a car to my Garage — is it reserved?",
    <>
      Not yet. Cars are held for you for 15 minutes once you place your order at checkout, while you
      complete payment. If payment isn&apos;t finished, they go back on sale.
    </>,
  ],
  [
    "How do I pay?",
    <>UPI, cards, net banking and wallets through Razorpay&apos;s secure checkout.</>,
  ],
  [
    "Do I need an account to order?",
    <>
      No, you can check out as a guest. With an account you can see your orders in{" "}
      <Link href="/account/orders">My orders</Link> and keep a{" "}
      <Link href="/wishlist">wishlist</Link>.
    </>,
  ],
  [
    "What are Treasure Hunts?",
    <>
      Rare chase cars hidden in regular cases. Super Treasure Hunts have Spectraflame paint and Real
      Riders tyres. Browse them in <Link href="/collections/treasure-hunts">the vault</Link>.
    </>,
  ],
  [
    "Something else?",
    <>
      Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or see{" "}
      <Link href="/shipping">Shipping</Link> and <Link href="/returns">Returns</Link>.
    </>,
  ],
];

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="FAQs"
      sections={QA.map(([heading, answer]) => ({ heading, body: <p>{answer}</p> }))}
    />
  );
}
