import { Bell } from "lucide-react";
import Image from "next/image";

// Halftone "lights": red radial glows seen through a fine grid, like stadium screens.
const GLOWS = ["left-[6%]", "left-[26%]", "left-[46%]", "left-[66%]", "left-[84%]"];

/** Upcoming F1 collection teaser. "Get notified" scrolls to the footer email signup. */
export function F1Banner() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">
      <div className="relative isolate reveal-on-scroll overflow-hidden rounded-3xl bg-[#0b0306] text-white">
        <div aria-hidden className="absolute inset-0 -z-10">
          {GLOWS.map((pos, i) => (
            <span
              key={pos}
              className={`absolute top-1/2 size-[38%] max-h-80 -translate-x-1/2 -translate-y-1/2 animate-glow-drift rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.75),rgb(225_29_72/0)_70%)] motion-reduce:animate-none ${pos}`}
              style={{ animationDelay: `${i * 0.9}s` }}
            />
          ))}
          {/* Grid mesh over the glows gives the halftone screen look. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0b0306_1.5px,transparent_1.5px),linear-gradient(to_bottom,#0b0306_1.5px,transparent_1.5px)] bg-[size:7px_7px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0306] via-transparent to-[#0b0306]/40" />
        </div>

        <div className="grid items-center gap-2 md:grid-cols-[1.15fr_1fr]">
          <div className="relative order-2 aspect-[2.2/1] md:order-1 md:aspect-auto md:h-[420px]">
            <Image
              src="/images/promo/f1-car.jpg"
              alt="A Formula 1 team car model"
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className="[mask-image:radial-gradient(ellipse_at_40%_50%,black_45%,transparent_78%)] object-cover object-left"
            />
          </div>

          <div className="relative order-1 px-6 pt-10 pb-2 md:order-2 md:py-12 md:pr-12 md:pl-0 md:text-right">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase backdrop-blur">
              <span className="size-2 animate-pulse-ring rounded-full bg-accent motion-reduce:animate-none" />
              Coming soon
            </span>
            <h2 className="mt-4 font-headline text-4xl leading-[0.95] font-extrabold tracking-tight uppercase italic sm:text-5xl lg:text-6xl">
              Expanding
              <br />
              the grid
            </h2>
            <p className="mt-4 text-base text-white/75 sm:text-lg">
              Formula 1® premium collectible team cars are landing in the garage.
            </p>
            <a
              href="#newsletter"
              className="group mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-night transition hover:-translate-y-0.5 hover:bg-brand"
            >
              <Bell className="size-4 transition-transform group-hover:rotate-12" /> Get notified
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
