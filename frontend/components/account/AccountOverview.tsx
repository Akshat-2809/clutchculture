"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Heart, LayoutDashboard, Package } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useMe } from "@/lib/use-me";

// Addresses arrive in Phase 3.
export function AccountOverview() {
  const router = useRouter();
  const params = useSearchParams();
  const [signingOut, setSigningOut] = useState(false);
  const { data: me } = useMe();

  const { data: user, isPending } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await createClient().auth.getUser()).data.user,
  });

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (isPending) return <p className="text-muted">Loading…</p>;

  const name = (user?.user_metadata?.full_name as string | undefined) ?? "there";

  return (
    <div className="space-y-6">
      {params.get("password") === "updated" && (
        <Alert variant="success">Your password has been updated.</Alert>
      )}
      <div>
        <h1 className="font-display text-4xl tracking-wide text-ink uppercase">Hi, {name}</h1>
        <p className="mt-2 text-muted">{user?.email}</p>
      </div>
      <ul className="grid max-w-2xl gap-3 sm:grid-cols-3">
        {[
          { href: "/account/orders", icon: Package, label: "My orders" },
          { href: "/wishlist", icon: Heart, label: "Wishlist" },
          ...(me?.role === "admin"
            ? [{ href: "/admin", icon: LayoutDashboard, label: "Admin dashboard" }]
            : []),
        ].map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 font-medium text-ink transition hover:-translate-y-0.5 hover:border-ink"
            >
              <Icon className="size-5" strokeWidth={1.75} /> {label}
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="outline" onClick={signOut} loading={signingOut}>
        Sign out
      </Button>
    </div>
  );
}
