"use client";

import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";

// Shown when /auth/callback couldn't use an email link. Wrap in <Suspense>.
export function LinkExpiredNotice() {
  const params = useSearchParams();
  if (params.get("error") !== "link_expired") return null;

  return (
    <Alert className="mb-5">
      That link has expired or was already used. Log in, or request a new link.
    </Alert>
  );
}
