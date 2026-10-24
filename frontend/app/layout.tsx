import type { Metadata } from "next";
import { JetBrains_Mono, Jost } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Rubik Dirt's textured glyphs are very heavy (Google's latin file is ~300 KB),
// so it's self-hosted as two subsets of the same font:
// - logo: only the letters in "CLUTCHCULTURE" (~22 KB), preloaded for every page;
// - caps: A–Z, digits and punctuation for display headings, fetched only when used.
// Regenerate with pyftsubset if the wordmark text changes.
const rubikDirtLogo = localFont({
  src: "./fonts/rubik-dirt-logo.woff2",
  variable: "--font-rubik-dirt-logo",
  display: "swap",
});

const rubikDirt = localFont({
  src: "./fonts/rubik-dirt-caps.woff2",
  variable: "--font-rubik-dirt",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: "700",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Clutch Culture",
    template: "%s | Clutch Culture",
  },
  description: "Premium collectibles — Hot Wheels, anime figures, limited editions and gift sets.",
};

// Runs before first paint: apply the saved theme (or the device's preference)
// so dark-mode visitors never see a flash of the light theme.
const themeScript = `try{var t=localStorage.getItem("cc-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      // The theme script adds the "dark" class before React hydrates.
      suppressHydrationWarning
      className={`${jost.variable} ${rubikDirt.variable} ${rubikDirtLogo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
