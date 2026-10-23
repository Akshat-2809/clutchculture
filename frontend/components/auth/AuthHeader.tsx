export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-headline text-4xl leading-none font-extrabold tracking-tight text-ink uppercase italic sm:text-5xl">
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-base text-muted">{subtitle}</p>}
    </div>
  );
}
