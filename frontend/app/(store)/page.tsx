import { Suspense } from "react";
import { ExploreAll } from "@/components/home/ExploreAll";
import { F1Banner } from "@/components/home/F1Banner";
import { Hero } from "@/components/home/Hero";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { ShopByPrice } from "@/components/home/ShopByPrice";
import { SlantMarquee } from "@/components/home/SlantMarquee";
import { TrendingGrid } from "@/components/home/TrendingGrid";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { getAllProducts, getFeaturedProducts, getTrendingProducts } from "@/lib/catalog.server";

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div className="mx-auto h-[560px] max-w-[1440px]" />}>
        <HomeSections />
      </Suspense>
      <SlantMarquee />
      <Suspense fallback={<div className="mx-auto h-[900px] max-w-[1440px]" />}>
        <ExploreAllSection />
      </Suspense>
      <RecentlyViewed />
      {/* Last section before the footer. */}
      <F1Banner />
    </>
  );
}

// Live catalogue data (stock changes with every order), streamed in after the hero.
async function HomeSections() {
  const [featured, trending, all] = await Promise.all([
    getFeaturedProducts(),
    getTrendingProducts(),
    getAllProducts(),
  ]);
  return (
    <>
      {/* "Featured" and "Trending" are switched per product in admin → Products. */}
      {featured.length > 0 && (
        <ProductCarousel title="Shop Cars" products={featured} href="/shop" />
      )}
      <TrendingGrid products={trending} />
      <ShopByPrice products={all} />
    </>
  );
}

// Same cached product list as Shop by price, so this costs no extra API call.
async function ExploreAllSection() {
  return <ExploreAll products={await getAllProducts()} />;
}
