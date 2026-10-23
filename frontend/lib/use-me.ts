"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "./api";
import { createClient } from "./supabase/client";

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

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession();
      if (!data.session) return null;
      return api<Me>("/me", { auth: true });
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}
