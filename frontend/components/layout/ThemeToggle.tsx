"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export const THEME_STORAGE_KEY = "cc-theme";
const EVENT = "cc-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}
const isDark = () => document.documentElement.classList.contains("dark");

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Storage blocked; the theme still applies for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Moon/sun toggle. The initial class is set before paint by the script in app/layout.tsx. */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const Icon = dark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(!dark)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {/* key re-mounts the icon so it spins in on each switch */}
      <Icon
        key={dark ? "sun" : "moon"}
        className={cn(
          "size-[22px] animate-spin-in motion-reduce:animate-none",
          withLabel && "size-5",
        )}
        strokeWidth={withLabel ? 1.75 : 2}
      />
      {withLabel && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
