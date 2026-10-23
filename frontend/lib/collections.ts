// Visual extras for collection headers. Name and description come from the
// database (admin → Collections); collections without an entry here get DEFAULT.

export type CollectionStyle = {
  eyebrow: string;
  tagline: string;
  accent: "brand" | "accent" | "white";
};

const DEFAULT: CollectionStyle = {
  eyebrow: "Collection",
  tagline: "Hand-picked for the garage.",
  accent: "brand",
};

const styles: Record<string, CollectionStyle> = {
  "new-drops": { eyebrow: "Just landed", tagline: "Fresh off the truck.", accent: "brand" },
  mainlines: {
    eyebrow: "1:64 everyday heroes",
    tagline: "The backbone of every collection.",
    accent: "accent",
  },
  premium: {
    eyebrow: "Metal · Rubber · Detail",
    tagline: "Display-grade, top to bottom.",
    accent: "white",
  },
  "treasure-hunts": { eyebrow: "The vault", tagline: "Chase the flame.", accent: "accent" },
  multipacks: {
    eyebrow: "More cars, better value",
    tagline: "Grow your garage faster.",
    accent: "brand",
  },
};

export function collectionStyle(slug: string) {
  return styles[slug] ?? DEFAULT;
}
