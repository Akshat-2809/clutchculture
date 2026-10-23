import Link from "next/link";
import { cn } from "@/lib/utils";

// Text wordmark until the client's logo file arrives — then swap in
// <Image src="/logo.svg" ... /> here and it updates everywhere.
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Clutch Culture home"
      className={cn(
        "font-display text-lg leading-none tracking-wide whitespace-nowrap text-ink sm:text-2xl lg:text-xl xl:text-2xl",
        className,
      )}
    >
      CLUTCH<span className="text-brand-dark">CULTURE</span>
    </Link>
  );
}
