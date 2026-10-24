import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Drop the licensed hero artwork into public/images/ and set the path here.
const HERO_IMAGE: string | null = "/images/hero-1920.webp";

// Repeating wave for the underline under "GARAGE".
const WAVE_PATH = `M0 8 Q 12.5 0 25 8 ${Array.from({ length: 11 }, (_, i) => `T ${50 + i * 25} 8`).join(" ")}`;

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/** One headline line that slides up out of a mask. */
function Line({
  ms,
  className,
  children,
}: {
  ms: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // Extra right/vertical padding so italic overhangs aren't clipped by the mask.
    <span className="block overflow-hidden py-[0.04em] pr-[0.12em]">
      <span
        className={cn("block animate-rise motion-reduce:animate-none", className)}
        style={delay(ms)}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * Outlined "SERIOUS". CSS text-stroke also traces the font's internal overlapping
 * contours, so this draws a double-width stroke and masks out the glyph fill,
 * leaving only a clean outer outline. 100 viewBox units = 1em, so it scales with
 * the h1; baseline sits at 0.7875em to match the 0.88 line-height of the other lines.
 */
function OutlineWord() {
  const word = "SERIOUS";
  const text = (props: React.SVGProps<SVGTextElement>) => (
    <text x="2" y="78.75" fontSize="100" {...props}>
      {word}
    </text>
  );

  return (
    <>
      <span className="sr-only">{word}</span>
      <svg
        aria-hidden
        viewBox="0 0 480 88"
        className="block h-[0.88em] w-auto overflow-visible"
        style={{ fontFamily: "var(--font-headline)", fontStyle: "italic", fontWeight: 800 }}
      >
        <defs>
          <mask
            id="hero-outline-mask"
            maskUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            width="520"
            height="128"
          >
            <rect x="-20" y="-20" width="520" height="128" fill="white" />
            {text({ fill: "black" })}
          </mask>
        </defs>
        {text({
          fill: "none",
          stroke: "white",
          strokeWidth: 4.5,
          strokeLinejoin: "round",
          mask: "url(#hero-outline-mask)",
        })}
      </svg>
    </>
  );
}

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-night py-16 sm:py-20 lg:min-h-[min(calc(100svh-7.25rem),860px)] lg:py-16">
      {HERO_IMAGE ? (
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          // The LCP image on every screen size: preload it from <head> so it starts
          // before fonts and scripts (Next 16 docs: use instead of loading/fetchPriority).
          preload
          sizes="100vw"
          // Anchored to the bottom so the car's wheels stay in frame; zoom grows from there too.
          className="-z-30 origin-[70%_100%] animate-slow-zoom object-cover object-[70%_100%] motion-reduce:animate-none"
        />
      ) : (
        // Placeholder approximating the design's warm track / dark scene tones.
        <div className="absolute inset-0 -z-30 animate-slow-zoom bg-[radial-gradient(ellipse_at_72%_62%,#c8702f_0%,#7a3a1c_30%,#2a1c2c_62%,#141420_100%)] motion-reduce:animate-none" />
      )}

      {/* Darken the left side so the copy stays readable over any image. */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/80 via-black/60 to-black/75 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/55 lg:to-black/10" />

      {/* Faint blueprint grid, fading out to the right. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [mask-image:linear-gradient(to_right,black_20%,transparent_75%)] bg-[size:72px_72px]"
      />

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-20">
        <h1 className="font-headline text-[clamp(2.9rem,min(8vw,9.75svh),6.75rem)] leading-[0.88] font-extrabold tracking-tight uppercase italic">
          <Line ms={100} className="text-white">
            Tiny
          </Line>
          <Line ms={220} className="text-white">
            Cars.
          </Line>
          <Line ms={340}>
            <OutlineWord />
          </Line>
          <span className="relative block w-fit">
            <Line ms={460} className="text-brand">
              Garage
            </Line>
            {/* Hidden by clip-path until the wipe runs, so nothing shows before it animates. */}
            <svg
              aria-hidden
              viewBox="0 0 300 16"
              preserveAspectRatio="none"
              className="absolute -bottom-[0.14em] left-0 h-[0.12em] w-[94%] animate-wipe overflow-visible [clip-path:inset(-50%_100%_-50%_0)] motion-reduce:animate-none motion-reduce:[clip-path:none]"
              style={delay(800)}
            >
              <path
                d={WAVE_PATH}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={3.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
        </h1>

        <p
          className="mt-8 max-w-xl animate-fade-up text-base leading-relaxed text-white/80 motion-reduce:animate-none sm:text-lg lg:mt-10"
          style={delay(1000)}
        >
          Fresh mainlines, premium Car Culture sets and the Treasure Hunts everyone is chasing.
          Every card checked by hand before it ships.
        </p>

        <div
          className="mt-8 flex animate-fade-up flex-wrap items-center gap-3 motion-reduce:animate-none sm:gap-4"
          style={delay(1150)}
        >
          <Link
            href="/collections/new-drops"
            className="group inline-flex h-13 items-center gap-3 rounded-full bg-brand px-7 text-base font-semibold text-brand-foreground shadow-[0_8px_30px_-8px_rgb(239_207_106/0.6)] transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Shop new drops
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-13 items-center rounded-full border-2 border-white/80 px-7 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-night"
          >
            Enter the vault
          </Link>
        </div>
      </div>
    </section>
  );
}
