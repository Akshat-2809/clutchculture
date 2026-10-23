import { create } from "zustand";
import { persist } from "zustand/middleware";

// Recently viewed product slugs (newest first), kept in the browser. Only slugs
// are stored; names, prices and stock are always fetched fresh.
const MAX = 12;

type RecentState = { slugs: string[]; push: (slug: string) => void };

export const useRecent = create<RecentState>()(
  persist(
    (set) => ({
      slugs: [],
      push: (slug) =>
        set((s) => ({ slugs: [slug, ...s.slugs.filter((x) => x !== slug)].slice(0, MAX) })),
    }),
    // Rehydrated in <Providers> after mount, like the cart.
    { name: "cc-recent", skipHydration: true },
  ),
);
