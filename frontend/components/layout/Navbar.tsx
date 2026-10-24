"use client";

import {
  ChevronDown,
  Flame,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { fallbackCollections } from "@/lib/navigation";
import { loadSupabase } from "@/lib/supabase/lazy";
import { useMe } from "@/lib/use-me";
import { useCollections } from "@/lib/use-products";
import { cn } from "@/lib/utils";
import { selectCartCount, useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { Logo } from "./Logo";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";

const iconButton =
  "relative flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-input";
const iconClass = "size-[21px]";
// Keep the category bar short; extra collections go under "More".
const MAX_NAV = 6;

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);
  return ref;
}

function AccountMenu() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  if (!me) {
    return (
      <Link href="/login" aria-label="Log in" className={iconButton}>
        <User className={iconClass} strokeWidth={2} />
      </Link>
    );
  }

  const name = me.fullName || me.email || "Account";
  const initials = name
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const items = [
    { href: "/account", icon: User, label: "My account" },
    { href: "/account", icon: Package, label: "Orders" },
    { href: "/wishlist", icon: Heart, label: "Wishlist" },
    ...(me.role === "admin"
      ? [{ href: "/admin", icon: LayoutDashboard, label: "Admin dashboard" }]
      : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="ml-1 grid size-10 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground transition hover:ring-4 hover:ring-brand/30"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute top-12 right-0 z-50 w-60 origin-top-right animate-fade-up rounded-2xl border border-border bg-background p-2 shadow-xl motion-reduce:animate-none">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            {me.email && <p className="truncate text-xs text-muted">{me.email}</p>}
          </div>
          <div className="my-1 h-px bg-border" />
          {items.map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/80 transition hover:bg-input hover:text-ink"
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
          <button
            onClick={async () => {
              setOpen(false);
              await (await loadSupabase()).auth.signOut();
              queryClient.setQueryData(["me"], null);
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sale transition hover:bg-sale/10"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MoreMenu({ items }: { items: { slug: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div className="relative" ref={ref} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        className="mx-3 flex items-center gap-1 py-1.5 text-sm font-medium text-ink/70 hover:text-ink"
      >
        More <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-50 w-56 animate-fade-up rounded-2xl border border-border bg-background p-2 shadow-xl motion-reduce:animate-none">
          {items.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-ink/80 hover:bg-input hover:text-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Second row: All · collections · More · Today's deals. Reads ?sort for the active pill. */
function CategoryBar({ collections }: { collections: { slug: string; name: string }[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const deals = pathname === "/shop" && params.get("sort") === "savings";
  const trending = pathname === "/shop" && params.get("trending") === "1";
  const links = [
    { key: "home", href: "/", name: "Home", active: pathname === "/" },
    { key: "all", href: "/shop", name: "All", active: pathname === "/shop" && !deals && !trending },
    { key: "trending", href: "/shop?trending=1", name: "Trending", active: trending },
    ...collections.slice(0, MAX_NAV).map((c) => ({
      key: c.slug,
      href: `/collections/${c.slug}`,
      name: c.name,
      active: pathname === `/collections/${c.slug}`,
    })),
  ];

  return (
    <nav
      aria-label="Categories"
      className="mx-auto hidden h-12 max-w-[1440px] items-center gap-1 px-4 sm:px-6 lg:flex lg:px-10"
    >
      {links.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          aria-current={l.active ? "page" : undefined}
          className={cn(
            "mx-3 flex items-center gap-1 py-1.5 text-sm font-medium transition first:ml-0",
            l.active ? "text-ink" : "text-ink/70 hover:text-ink",
          )}
        >
          {l.key === "trending" && <Flame className="size-3.5 fill-accent text-accent" />}
          <span className={cn("link-underline", l.active && "link-underline-active")}>
            {l.name}
          </span>
        </Link>
      ))}
      {collections.length > MAX_NAV && <MoreMenu items={collections.slice(MAX_NAV)} />}
      <Link href="/shop?sort=savings" className="ml-auto py-1.5 text-sm font-semibold text-accent">
        <span className={cn("link-underline", deals && "link-underline-active")}>
          Today&apos;s Deals
        </span>
      </Link>
    </nav>
  );
}

export function Navbar() {
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = useCart(selectCartCount);
  const wishCount = useWishlist((s) => s.slugs.length);
  // Live from the API so admin-added collections appear; fallback while loading.
  const { data: collections = fallbackCollections } = useCollections();
  const { data: me } = useMe();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="-ml-1 p-1 lg:hidden"
        >
          {menuOpen ? (
            <X className="size-[22px]" strokeWidth={1.75} />
          ) : (
            <Menu className="size-[22px]" strokeWidth={1.75} />
          )}
        </button>

        <Logo className="mr-2" />

        <button
          onClick={() => setSearchOpen(true)}
          className="mx-auto hidden h-11 w-full max-w-md items-center gap-3 rounded-full border border-input-border bg-input px-4 text-sm text-placeholder transition hover:border-ink/30 md:flex"
        >
          <Search className="size-[18px]" />
          <span className="flex-1 text-left">Search castings, brands, series…</span>
          <kbd className="rounded-md border border-input-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1 md:ml-0">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className={cn(iconButton, "md:hidden")}
          >
            <Search className={iconClass} strokeWidth={2} />
          </button>
          <ThemeToggle className={cn(iconButton, "hidden sm:flex")} />
          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishCount} saved`}
            className={cn(iconButton, "hidden sm:flex")}
          >
            <Heart className={iconClass} strokeWidth={2} />
            {wishCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 animate-pop rounded-full bg-accent" />
            )}
          </Link>

          <Link
            href="/garage"
            data-cart-target
            aria-label={`Garage, ${cartCount} items`}
            className="mx-1 flex h-11 items-center gap-2.5 rounded-full bg-ink py-1.5 pr-1.5 pl-3.5 text-background transition hover:bg-ink/85 sm:pl-4"
          >
            <ShoppingCart data-cart-icon className="size-[21px]" strokeWidth={2} />
            <span className="hidden text-base font-semibold xl:inline">Garage</span>
            {/* key re-mounts the count so it pops on every change */}
            <span
              key={cartCount}
              className="flex size-8 animate-pop items-center justify-center rounded-full bg-background text-sm font-semibold text-ink motion-reduce:animate-none"
            >
              {cartCount}
            </span>
          </Link>

          {/* On phones the account links live in the menu, so the bar fits 360px screens. */}
          <div className="hidden sm:block">
            <AccountMenu />
          </div>
        </div>
      </div>

      <Suspense>
        <CategoryBar collections={collections} />
      </Suspense>

      {menuOpen && (
        <nav aria-label="Mobile" className="border-t border-border bg-background lg:hidden">
          <ul className="flex flex-col px-4 py-2 sm:px-6">
            {[
              { label: "Home", href: "/" },
              { label: "All cars", href: "/shop" },
              { label: "Trending", href: "/shop?trending=1" },
              ...collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
              { label: "Today's Deals", href: "/shop?sort=savings" },
              { label: "Wishlist", href: "/wishlist" },
              me ? { label: "My account", href: "/account" } : { label: "Log in", href: "/login" },
              ...(me?.role === "admin" ? [{ label: "Admin dashboard", href: "/admin" }] : []),
            ].map((item) => (
              <li key={item.label} className="border-b border-border last:border-0">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block py-3 text-base text-ink",
                    item.label === "Today's Deals" && "font-semibold text-accent",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-border">
              <ThemeToggle
                withLabel
                className="flex w-full items-center gap-3 py-3 text-base text-ink"
              />
            </li>
            {me && (
              <li className="border-t border-border sm:hidden">
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await (await loadSupabase()).auth.signOut();
                    queryClient.setQueryData(["me"], null);
                    router.push("/");
                    router.refresh();
                  }}
                  className="flex w-full items-center gap-3 py-3 text-base text-sale"
                >
                  <LogOut className="size-5" strokeWidth={1.75} /> Log out
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
