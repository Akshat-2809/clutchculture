import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop all cars",
  description: "Browse every die-cast model in the Clutch Culture garage.",
};

export default function ShopPage() {
  return (
    // Filters live in the URL (useSearchParams), so the view renders on the client.
    <Suspense>
      <ShopView />
    </Suspense>
  );
}
