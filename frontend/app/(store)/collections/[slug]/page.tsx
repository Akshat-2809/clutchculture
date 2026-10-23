import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionGrid } from "@/components/collection/CollectionGrid";
import { getCollectionDetail } from "@/lib/catalog.server";
import { collectionStyle, type CollectionStyle } from "@/lib/collections";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const data = await getCollectionDetail((await params).slug);
  if (!data) return {};
  return { title: data.collection.name, description: data.collection.description ?? undefined };
}

const accentText: Record<CollectionStyle["accent"], string> = {
  brand: "text-brand",
  accent: "text-accent",
  white: "text-white",
};
const accentChip: Record<CollectionStyle["accent"], string> = {
  brand: "bg-brand text-brand-foreground",
  accent: "bg-accent text-white",
  white: "bg-white text-night",
};

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="h-[420px] animate-pulse bg-night" />}>
      {params.then(({ slug }) => (
        <CollectionContent slug={slug} />
      ))}
    </Suspense>
  );
}

async function CollectionContent({ slug }: { slug: string }) {
  const data = await getCollectionDetail(slug);
  if (!data) notFound();
  const { products } = data;
  const collection = { ...data.collection, ...collectionStyle(slug) };
  const inStock = products.filter((p) => p.stock > 0).length;

  return (
    <>
      <header className="relative isolate overflow-hidden bg-night">
        {/* Same blueprint grid as the hero, fading to the right. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [mask-image:linear-gradient(to_right,black_30%,transparent_85%)] bg-[size:72px_72px]"
        />
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-white/60">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden />
              <li aria-current="page" className="text-white">
                {collection.name}
              </li>
            </ol>
          </nav>

          <span
            className={cn(
              "inline-block animate-fade-up rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase motion-reduce:animate-none",
              accentChip[collection.accent],
            )}
          >
            {collection.eyebrow}
          </span>
          <h1
            className="mt-4 animate-fade-up font-headline text-5xl leading-[0.9] font-extrabold tracking-tight text-white uppercase italic motion-reduce:animate-none sm:text-7xl lg:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            {collection.name}
          </h1>
          <p
            className={cn(
              "mt-4 animate-fade-up text-xl font-semibold motion-reduce:animate-none sm:text-2xl",
              accentText[collection.accent],
            )}
            style={{ animationDelay: "160ms" }}
          >
            {collection.tagline}
          </p>
          <p
            className="mt-3 max-w-xl animate-fade-up text-base text-white/70 motion-reduce:animate-none"
            style={{ animationDelay: "220ms" }}
          >
            {collection.description}
          </p>
          <p
            className="mt-6 animate-fade-up text-sm text-white/50 motion-reduce:animate-none"
            style={{ animationDelay: "280ms" }}
          >
            {products.length} models · {inStock} in stock
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <CollectionGrid products={products} />
      </section>
    </>
  );
}
