import { BadgeCheck, ChevronRight, PackageCheck, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToGarage } from "@/components/product/AddToGarage";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RecordView } from "@/components/product/RecordView";
import { SaveBadge } from "@/components/product/SaveBadge";
import { WishlistButton } from "@/components/product/WishlistButton";
import { savePercent } from "@/lib/catalog";
import { getProductDetail } from "@/lib/catalog.server";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const data = await getProductDetail((await params).slug);
  if (!data) return {};
  const { product } = data;
  return {
    title: product.name,
    description: product.description,
    openGraph: product.image ? { images: [product.image] } : undefined,
  };
}

const perks = [
  {
    icon: PackageCheck,
    title: "Packed card-safe",
    text: "Blister and card protected on every order.",
  },
  { icon: BadgeCheck, title: "Checked by hand", text: "Every piece inspected before it ships." },
  { icon: ShieldCheck, title: "Secure payments", text: "UPI, cards and netbanking via Razorpay." },
];

// Product data (and live stock) is fetched per request, so it streams in
// behind a skeleton.
export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      {params.then(({ slug }) => (
        <ProductContent slug={slug} />
      ))}
    </Suspense>
  );
}

async function ProductContent({ slug }: { slug: string }) {
  const data = await getProductDetail(slug);
  if (!data) notFound();
  const { product, related } = data;
  const collection = product.collection
    ? { slug: product.collection, name: product.collectionName ?? product.collection }
    : null;

  const save = savePercent(product);
  const specs = [
    ["Brand", product.brand],
    ["Scale", product.scale],
    ["Series", product.series],
    ["Material", product.material],
  ].filter(([, value]) => value);

  return (
    <>
      <RecordView slug={product.slug} />
      <div className="mx-auto max-w-[1440px] px-4 pt-6 pb-12 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            {collection && (
              <>
                <li>
                  <Link href={`/collections/${collection.slug}`} className="hover:text-ink">
                    {collection.name}
                  </Link>
                </li>
                <ChevronRight className="size-3.5" aria-hidden />
              </>
            )}
            <li aria-current="page" className="line-clamp-1 text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="animate-fade-up motion-reduce:animate-none">
            <ProductGallery images={product.images} name={product.name}>
              {save && <SaveBadge percent={save} className="absolute top-4 left-4 text-base" />}
              <WishlistButton
                slug={product.slug}
                name={product.name}
                className="absolute top-4 right-4 size-12"
              />
            </ProductGallery>
          </div>

          <div
            className="animate-fade-up motion-reduce:animate-none lg:sticky lg:top-28 lg:self-start"
            style={{ animationDelay: "120ms" }}
          >
            <p className="text-sm tracking-wide text-muted uppercase">{product.brand}</p>
            <h1 className="mt-2 text-3xl leading-tight font-medium tracking-tight text-ink sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-semibold text-price">
                {formatPrice(product.price)}
              </span>
              {save && (
                <>
                  <s className="text-xl text-price/60">{formatPrice(product.compareAtPrice!)}</s>
                  <span className="text-sm font-semibold text-save-foreground">{save}% off</span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">Inclusive of all taxes</p>

            <StockStatus stock={product.stock} />

            <div className="mt-6">
              <AddToGarage slug={product.slug} stock={product.stock} />
            </div>

            <ul className="mt-8 grid gap-4 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {perks.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-ink" strokeWidth={1.75} />
                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            {product.description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-ink">About this model</h2>
                <p className="mt-2 leading-relaxed whitespace-pre-line text-ink/80">
                  {product.description}
                </p>
              </div>
            )}

            <dl className="mt-6 divide-y divide-border rounded-xl border border-border">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="border-t border-border">
          <ProductCarousel title="You may also like" products={related} />
        </div>
      )}
    </>
  );
}

function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <p className="mt-4 text-sm font-medium text-sale">Sold out</p>;
  }
  const low = stock <= 3;
  return (
    <p className="mt-4 flex items-center gap-2 text-sm font-medium">
      <span className={low ? "relative flex size-2.5" : "flex size-2.5"}>
        {low && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/70 motion-reduce:animate-none" />
        )}
        <span
          className={`relative inline-flex size-2.5 rounded-full ${low ? "bg-accent" : "bg-in-stock"}`}
        />
      </span>
      <span className={low ? "text-accent" : "text-in-stock"}>
        {low ? `Only ${stock} left` : "In stock"}
      </span>
    </p>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1440px] animate-pulse gap-8 px-4 pt-16 pb-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10">
      <div className="aspect-square rounded-2xl bg-surface" />
      <div className="space-y-4 pt-4">
        <div className="h-4 w-24 rounded bg-surface" />
        <div className="h-10 w-4/5 rounded bg-surface" />
        <div className="h-8 w-32 rounded bg-surface" />
        <div className="h-14 rounded-full bg-surface" />
      </div>
    </div>
  );
}
