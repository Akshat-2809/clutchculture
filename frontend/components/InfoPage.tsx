import Link from "next/link";

export type InfoSection = { heading: string; body: React.ReactNode };

/** Shared layout for help and policy pages (shipping, returns, FAQ, terms…). */
export function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
  updated,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  sections: InfoSection[];
  updated?: string;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="mb-6 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-1">/</span>
        <span className="text-ink">{title}</span>
      </nav>
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-headline text-4xl font-extrabold tracking-tight text-ink uppercase italic sm:text-5xl">
        {title}
      </h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.heading} className="animate-fade-up motion-reduce:animate-none">
            <h2 className="text-xl font-semibold text-ink">{s.heading}</h2>
            <div className="mt-2 space-y-3 leading-relaxed text-ink/80 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2">
              {s.body}
            </div>
          </section>
        ))}
      </div>
      {updated && <p className="mt-12 text-xs text-muted">Last updated {updated}</p>}
    </article>
  );
}
