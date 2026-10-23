import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FRONT = [
  "Real Riders",
  "Spectraflame",
  "Super Treasure Hunt",
  "Car Culture",
  "Premium metal",
  "Chase cars",
];
const BACK = ["New drop every week", "Packed card-safe", "Hand-checked", "Shipped across India"];

function Band({
  items,
  className,
  textClass,
  separator,
  animation,
}: {
  items: string[];
  className: string;
  textClass: string;
  separator: React.ReactNode;
  animation: string;
}) {
  // Two copies side by side; the track slides by exactly one copy (-50%) and loops.
  const row = (hidden?: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {[...items, ...items].map((t, i) => (
        <li key={i} className="flex items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
          <span className={cn("whitespace-nowrap", textClass)}>{t}</span>
          {separator}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("overflow-hidden py-3 sm:py-4", className)}>
      <div
        className={cn(
          "flex w-max group-hover:[animation-play-state:paused] motion-reduce:animate-none",
          animation,
        )}
      >
        {row()}
        {row(true)}
      </div>
    </div>
  );
}

/** Two crossing slanted bands scrolling in opposite directions. */
export function SlantMarquee() {
  return (
    <section
      aria-label="What we stock"
      className="group relative isolate my-10 overflow-hidden py-14 sm:my-14 sm:py-20"
    >
      <Band
        items={BACK}
        animation="animate-marquee-reverse"
        className="absolute inset-x-[-5%] top-1/2 -z-10 -translate-y-1/2 rotate-[2.5deg] bg-night"
        textClass="font-headline text-2xl font-extrabold tracking-tight text-transparent uppercase italic [-webkit-text-stroke:1px_rgb(255_255_255/0.55)] sm:text-4xl"
        separator={<span className="size-2 shrink-0 rotate-45 bg-brand" aria-hidden />}
      />
      <Band
        items={FRONT}
        animation="animate-marquee-fast"
        className="relative -mx-[5%] -rotate-[2.5deg] bg-electric shadow-[0_18px_40px_-18px_rgb(39_82_255/0.8)]"
        textClass="font-headline text-2xl font-extrabold tracking-tight text-white uppercase italic sm:text-4xl"
        separator={
          <X className="size-6 shrink-0 text-accent sm:size-8" strokeWidth={2.5} aria-hidden />
        }
      />
    </section>
  );
}
