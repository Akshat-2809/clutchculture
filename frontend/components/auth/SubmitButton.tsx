import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Full-width submit with an arrow that nudges right on hover. */
export function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <Button type="submit" loading={loading} className="group h-13 w-full">
      {children}
      {!loading && (
        <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-1" />
      )}
    </Button>
  );
}
