import { Gem, Heart, PackageCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const perks = [
  { icon: Gem, text: "First dibs on Treasure Hunts in the vault" },
  { icon: Heart, text: "Save favourites to your wishlist" },
  { icon: PackageCheck, text: "Packed card-safe, every single order" },
];

/** Dark brand panel beside the auth forms (desktop only). */
export function AuthPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-night lg:block">
      <div className="absolute top-10 -left-20 size-96 animate-drift-a rounded-full bg-brand/40 blur-[110px] motion-reduce:animate-none" />
      <div className="absolute right-0 -bottom-20 size-96 animate-drift-b rounded-full bg-accent/40 blur-[110px] motion-reduce:animate-none" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:72px_72px]"
      />

      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        {/* The wordmark is dark text; give it a light chip on the dark panel. */}
        <Logo className="w-fit rounded-full bg-white px-4 py-2 text-night" />

        <div>
          <h2 className="font-headline text-5xl leading-[0.95] font-extrabold tracking-tight uppercase italic xl:text-6xl">
            Tiny cars.
            <br />
            <span className="text-brand">Serious garage.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {perks.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="flex animate-slide-in items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur motion-reduce:animate-none"
                style={{ animationDelay: `${300 + i * 120}ms` }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-white/15">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">Hand-checked die-cast, shipped across India.</p>
      </div>
    </aside>
  );
}
