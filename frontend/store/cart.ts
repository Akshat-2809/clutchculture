import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Guest cart ("Garage"), saved in localStorage. Phase 3 syncs it to the API for
// signed-in users; Phase 4 re-checks prices and stock on the server at checkout.

export type CartItem = { slug: string; qty: number };

/** Per-line cap, matching the quantity steppers. */
export const MAX_QTY_PER_ITEM = 10;

type CartState = {
  items: CartItem[];
  /** Adds qty, never exceeding `max` (the item's stock, capped at MAX_QTY_PER_ITEM). */
  add: (slug: string, qty: number, max: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (slug, qty, max) =>
        set((state) => {
          const cap = Math.min(max, MAX_QTY_PER_ITEM);
          const existing = state.items.find((i) => i.slug === slug);
          return {
            items: existing
              ? state.items.map((i) =>
                  i.slug === slug ? { ...i, qty: Math.min(cap, i.qty + qty) } : i,
                )
              : [...state.items, { slug, qty: Math.min(cap, qty) }],
          };
        }),
      setQty: (slug, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.slug === slug ? { ...i, qty } : i)),
        })),
      remove: (slug) => set((state) => ({ items: state.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cc-cart",
      // Rehydrated in <Providers> after mount, so server and first client render match.
      skipHydration: true,
    },
  ),
);

export const selectCartCount = (state: CartState) => state.items.reduce((sum, i) => sum + i.qty, 0);

/** False until the saved cart has loaded, so pages don't flash "empty". */
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
