import type { Metadata } from "next";
import { JetBrains_Mono, Jost, Rubik_Dirt } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const rubikDirt = Rubik_Dirt({
  variable: "--font-rubik-dirt",
  weight: "400",
  subsets: ["latin"],
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
      className={`${jost.variable} ${rubikDirt.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
