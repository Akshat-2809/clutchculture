import type { SupabaseClient } from "@supabase/supabase-js";

// supabase-js is ~67 KB gzipped. Storefront code that runs on every page (navbar,
// API helper) loads it on demand instead, and skips it entirely for visitors who
// aren't logged in — which is most of them. Auth pages import ./client directly.

let client: Promise<SupabaseClient> | null = null;

export function loadSupabase() {
  client ??= import("./client").then((m) => m.createClient());
  return client;
}

/** @supabase/ssr keeps the session in `sb-<project>-auth-token` cookies (readable by JS). */
export function hasSessionCookie() {
  return typeof document !== "undefined" && /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
}
