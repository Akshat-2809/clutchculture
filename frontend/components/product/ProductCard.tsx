import Image from "next/image";
import Link from "next/link";
import { savePercent, type ProductSummary } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { QuickAdd } from "./QuickAdd";
import { SaveBadge } from "./SaveBadge";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product, sizes }: { product: ProductSummary; sizes: string }) {
  const { slug, brand, name, image, price, compareAtPrice, stock } = product;
  const href = `/product/${slug}`;
  const save = savePercent(product);
  const soldOut = stock <= 0;

  return (
    <article className="group">
      {/* Buttons sit beside the link (not inside it) so they stay valid, separate controls. */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            sizes={sizes}
            className={cn(
              "object-cover transition-transform duration-500 ease-out group-hover:scale-105",
              soldOut && "opacity-60 grayscale-[40%]",
            )}
          />
        </Link>
        {soldOut ? (
          <span className="absolute top-3 left-3 rounded-full bg-night px-3 py-1 text-sm font-semibold text-white">
            Sold out
          </span>
        ) : (
          save && <SaveBadge percent={save} className="absolute top-3 left-3" />
        )}
        <WishlistButton slug={slug} name={name} className="absolute top-3 right-3" />
        <QuickAdd slug={slug} name={name} stock={stock} />
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-sm tracking-wide text-muted uppercase">{brand}</p>
        <h3 className="text-lg leading-snug text-ink">
          <Link href={href} className="line-clamp-3 hover:underline hover:underline-offset-2">
            {name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-3 text-lg">
          {save && <s className="text-price/70">{formatPrice(compareAtPrice!)}</s>}
          <span className="font-medium text-price">{formatPrice(price)}</span>
        </p>
      </div>
    </article>
  );
}
