// Edit these to change the scrolling messages.
const messages = [
  "Treasure hunts in the vault",
  "Packed card-safe, every order",
  "Free shipping over [amount]", // TODO: set once the client decides shipping rules
  "New drop every week",
];

function MessageList({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {/* Repeated so one copy is wider than very large screens. */}
      {[...messages, ...messages].map((message, i) => (
        <li key={i} className="flex items-center gap-10 pr-16 sm:gap-16 sm:pr-24">
          <span aria-hidden className="size-2.5 shrink-0 bg-accent" />
          <span className="whitespace-nowrap">{message}</span>
        </li>
      ))}
    </ul>
  );
}

export function MarqueeBar() {
  return (
    <div className="overflow-hidden bg-night py-3 font-mono text-xs font-bold tracking-[0.18em] text-white uppercase sm:text-sm">
      {/* Two identical copies; the track slides left by exactly one copy and loops. */}
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        <MessageList />
        <MessageList hidden />
      </div>
    </div>
  );
}
