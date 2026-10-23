"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  max,
  onChange,
  size = "lg",
  label = "quantity",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  size?: "sm" | "lg";
  label?: string;
}) {
  const button = cn(
    "flex items-center justify-center text-ink transition hover:text-ink/60 disabled:text-ink/25",
    size === "lg" ? "size-14" : "size-9",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-input-border",
        size === "lg" ? "h-14" : "h-9",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={`Decrease ${label}`}
        className={button}
      >
        <Minus className="size-4" />
      </button>
      <span
        className={cn(
          "text-center font-semibold tabular-nums",
          size === "lg" ? "w-6 text-base" : "w-5 text-sm",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className={button}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
