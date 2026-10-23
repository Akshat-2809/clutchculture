import { MarqueeBar } from "@/components/layout/MarqueeBar";
import { CopyrightYear } from "@/components/layout/CopyrightYear";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

// Storefront chrome. The admin panel (app/admin) has its own layout.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <MarqueeBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer year={<CopyrightYear />} />
    </>
  );
}
