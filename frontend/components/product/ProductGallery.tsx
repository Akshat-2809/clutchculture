"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Main image with thumbnails when a product has more than one photo. */
export function ProductGallery({
  images,
  name,
  children,
}: {
  images: string[];
  name: string;
  /** Overlays (badge, wishlist) rendered on the main image. */
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const src = images[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        {src ? (
          <Image
            key={src}
            data-product-image
            src={src}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="animate-fade-up object-cover motion-reduce:animate-none"
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-12 text-muted" strokeWidth={1.25} />
        )}
        {children}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <li key={img}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative size-20 overflow-hidden rounded-xl bg-surface ring-offset-2 ring-offset-background transition",
                  i === active ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
