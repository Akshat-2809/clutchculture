import { cn } from "@/lib/utils";

export function Alert({
  variant = "error",
  className,
  children,
}: {
  variant?: "error" | "success" | "info";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variant === "error" && "border-sale/30 bg-sale/5 text-sale",
        variant === "success" &&
          "border-green-600/30 bg-green-50 text-green-800 dark:border-green-400/30 dark:bg-green-950/40 dark:text-green-300",
        variant === "info" && "border-input-border bg-input text-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}
