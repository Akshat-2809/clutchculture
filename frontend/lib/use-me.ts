"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "./api";
import { hasSessionCookie, loadSupabase } from "./supabase/lazy";

export type Me = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

/** The signed-in user's profile (null when signed out). Role comes from the API's database. */
export function useMe() {
  const queryClient = useQueryClient();

  // Logged-out visitors never load supabase-js; login/register/logout update
  // ["me"] themselves. For a logged-in visitor, keep it in sync with token changes.
  useEffect(() => {
    if (!hasSessionCookie()) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    loadSupabase().then((sb) => {
      if (cancelled) return;
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          queryClient.invalidateQueries({ queryKey: ["me"] });
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      if (!hasSessionCookie()) return null;
      const { data } = await (await loadSupabase()).auth.getSession();
      if (!data.session) return null;
      return api<Me>("/me", { auth: true });
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}
