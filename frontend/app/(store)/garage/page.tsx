import type { Metadata } from "next";
import { GarageView } from "@/components/cart/GarageView";

export const metadata: Metadata = { title: "Your Garage", robots: { index: false } };

export default function GaragePage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <h1 className="mb-8 font-headline text-4xl font-extrabold tracking-tight uppercase italic sm:text-5xl">
        Your Garage
      </h1>
      <GarageView />
    </section>
  );
}
