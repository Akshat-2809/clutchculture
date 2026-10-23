"use client";

import { useEffect } from "react";
import { useRecent } from "@/store/recent";

/** Adds this product to the visitor's "Recently viewed" list. Renders nothing. */
export function RecordView({ slug }: { slug: string }) {
  const push = useRecent((s) => s.push);
  useEffect(() => {
    // Wait for the saved list to load so it isn't overwritten.
    if (useRecent.persist.hasHydrated()) push(slug);
    else return useRecent.persist.onFinishHydration(() => push(slug));
  }, [slug, push]);
  return null;
}
