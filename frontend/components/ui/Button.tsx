import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "brand" | "outline";
  loading?: boolean;
};

const variants = {
  primary: "bg-ink text-background hover:bg-ink/85",
  brand: "bg-brand text-brand-foreground hover:bg-brand-dark",
  outline: "border border-input-border bg-background text-ink hover:bg-input",
};

export function Button({
  variant = "primary",
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
