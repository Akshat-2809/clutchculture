import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/views/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

// Admin pages render in the browser behind login (data comes from the API with
// the admin's token), so there's nothing for instant-navigation validation to check.
export const instant = false;

export default function Page() {
  return <DashboardView />;
}
