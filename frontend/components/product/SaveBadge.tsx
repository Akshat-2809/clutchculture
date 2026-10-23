import { cn } from "@/lib/utils";

// Discount pill, e.g. "-13%".
export function SaveBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white shadow-sm",
        className,
      )}
    >
      -{percent}%
    </span>
  );
}
