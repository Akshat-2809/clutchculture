import type { AuthError } from "@supabase/supabase-js";

/** Only allow same-site relative paths, so ?next= can't redirect off-site. */
export function safeRedirect(path: string | null | undefined, fallback = "/account") {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

/** Reads ?next= from the current URL (client only). */
export function getNextParam(fallback = "/account") {
  return safeRedirect(new URLSearchParams(window.location.search).get("next"), fallback);
}

export function authCallbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function authErrorMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please verify your email before logging in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "same_password":
      return "Your new password must be different from the old one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "session_not_found":
    case "session_expired":
      return "Your reset link has expired. Please request a new one.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
