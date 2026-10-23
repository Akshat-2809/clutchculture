import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

// Public page: the wishlist is kept in the browser, so no login is needed.
export default function WishlistPage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <h1 className="mb-8 font-headline text-4xl font-extrabold tracking-tight uppercase italic sm:text-5xl">
        Wishlist
      </h1>
      <WishlistView />
    </section>
  );
}
