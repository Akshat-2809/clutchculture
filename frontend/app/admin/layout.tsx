import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Clutch Culture" },
  robots: { index: false },
};

export const instant = false;

// Signed-out visitors are redirected to /login by proxy.ts; the API enforces
// the admin role on every /api/admin request.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
