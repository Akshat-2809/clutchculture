import { cn } from "@/lib/utils";

const LABELS = ["Too weak", "Weak", "Okay", "Good", "Strong"];
const COLORS = ["bg-sale", "bg-accent", "bg-brand", "bg-in-stock"];

function score(password: string) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

/** 4-segment meter shown while typing a new password. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const s = score(password);

  return (
    <div className="mt-2 animate-fade-up motion-reduce:animate-none" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < s ? COLORS[s - 1] : "bg-input-border",
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">
        {LABELS[s]} · use 8+ characters with numbers &amp; symbols
      </p>
    </div>
  );
}
