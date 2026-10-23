import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & { invalid?: boolean };

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-12 w-full rounded-xl border border-input-border bg-input px-4 text-base text-ink transition outline-none placeholder:text-placeholder focus:border-ink/40 focus:bg-background",
        invalid && "border-sale focus:border-sale",
        className,
      )}
      {...props}
    />
  );
}
