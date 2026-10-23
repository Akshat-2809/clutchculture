import { NextResponse, type NextRequest } from "next/server";
import { safeRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Landing URL for links in Supabase emails (signup verification, password reset).
// Exchanges the one-time ?code= for a session cookie, then continues to ?next=.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?error=link_expired", origin));
}
