import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Placeholder font — replace with brand fonts from the design in Phase 1.
const sans = Geist({
  variable: "--font-brand-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Clutch Culture",
    template: "%s | Clutch Culture",
  },
  description: "Clutch Culture — official store.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          {/* Phase 1: <AnnouncementBar /> <Navbar /> */}
          <main className="flex-1">{children}</main>
          {/* Phase 1: <Footer /> <CartDrawer /> */}
        </Providers>
      </body>
    </html>
  );
}
