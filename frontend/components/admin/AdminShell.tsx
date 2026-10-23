"use client";

import {
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  ShieldAlert,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";
import { Drawer, Toaster, btn } from "./ui";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/collections", icon: FolderTree, label: "Collections" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map(({ href, icon: Icon, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-brand text-brand-foreground shadow-[0_8px_24px_-10px_rgb(239_207_106/0.9)]"
                : "text-ink/70 hover:bg-input hover:text-ink",
            )}
          >
            <Icon className="size-[18px]" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: me, isPending } = useMe();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // proxy.ts already sends signed-out visitors to /login; the API checks the
  // admin role on every request, so this gate is only for a friendly message.
  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="size-8 animate-spin rounded-full border-2 border-ink border-r-transparent" />
      </div>
    );
  }
  if (!me || me.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <ShieldAlert className="mx-auto size-12 text-sale" strokeWidth={1.5} />
          <h1 className="mt-4 text-2xl font-semibold text-ink">Admins only</h1>
          <p className="mt-2 text-muted">
            {me ? `${me.email} doesn't have admin access.` : "Please log in with an admin account."}
          </p>
          <Link href={me ? "/" : "/login?next=/admin"} className={cn(btn.primary, "mt-6")}>
            {me ? "Back to the store" : "Log in"}
          </Link>
        </div>
      </div>
    );
  }

  const firstName = (me.fullName || me.email || "").split(/[\s@]/)[0];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-background p-5 lg:flex">
        <Logo className="text-xl" />
        <p className="mt-2 mb-6 text-[11px] font-semibold tracking-widest text-muted uppercase">
          Admin panel
        </p>
        <Nav />
        <Link
          href="/"
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 hover:bg-input hover:text-ink"
        >
          <Store className="size-[18px]" /> View store
        </Link>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-8">
          <button
            className={cn(btn.icon, "-ml-2 lg:hidden")}
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </button>
          <p className="text-sm text-muted">
            Welcome back, <b className="text-ink">{firstName}</b>
          </p>
          <ThemeToggle className={cn(btn.icon, "ml-auto")} />
        </header>
        <main key={pathname} className="animate-fade-up p-4 motion-reduce:animate-none sm:p-8">
          {children}
        </main>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Admin" side="left">
        <div className="p-4">
          <Nav onNavigate={() => setOpen(false)} />
          <Link
            href="/"
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/70"
          >
            <Store className="size-[18px]" /> View store
          </Link>
        </div>
      </Drawer>
      <Toaster />
    </div>
  );
}
