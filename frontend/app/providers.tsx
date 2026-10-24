"use client";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useRecent } from "@/store/recent";
import { useWishlist } from "@/store/wishlist";

// Public catalogue queries (products, collections) are remembered in the browser,
// so returning visitors see the shop, Garage and wishlist instantly while fresh
// data loads in the background. Personal or admin data is never stored.
const PUBLIC_KEYS = new Set(["products", "collections"]);

function makePersister() {
  let storage: Storage | undefined;
  try {
    storage = typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    storage = undefined; // storage blocked (private mode etc.): just don't persist
  }
  return createSyncStoragePersister({ storage, key: "cc-catalog-cache", throttleTime: 2000 });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } }),
  );
  const [persistOptions] = useState(() => ({
    persister: makePersister(),
    maxAge: 24 * 60 * 60 * 1000,
    // Bump to drop everyone's saved cache after a breaking API change.
    buster: "v1",
    dehydrateOptions: {
      shouldDehydrateQuery: (q: { state: { status: string }; queryKey: readonly unknown[] }) =>
        q.state.status === "success" && PUBLIC_KEYS.has(String(q.queryKey[0])),
    },
  }));

  // Load the saved cart and wishlist after hydration (see skipHydration in the stores).
  useEffect(() => {
    useCart.persist.rehydrate();
    useWishlist.persist.rehydrate();
    useRecent.persist.rehydrate();
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
}
