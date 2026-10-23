import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Guest wishlist, saved in localStorage — works without logging in. Phase 3
// syncs it to the account for signed-in users.

type WishlistState = {
  slugs: string[];
  toggle: (slug: string) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      slugs: [],
      toggle: (slug) =>
        set((state) => ({
          slugs: state.slugs.includes(slug)
            ? state.slugs.filter((s) => s !== slug)
            : [...state.slugs, slug],
        })),
    }),
    // Rehydrated in <Providers> after mount, like the cart.
    { name: "cc-wishlist", skipHydration: true },
  ),
);

/** False until the saved wishlist has loaded, so the page doesn't flash "empty". */
export function useWishlistHydrated() {
  return useSyncExternalStore(
    (onChange) => useWishlist.persist.onFinishHydration(onChange),
    () => useWishlist.persist.hasHydrated(),
    () => false,
  );
}
