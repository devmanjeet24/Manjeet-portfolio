import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { CursorSystem } from "@/components/layout/cursor-system";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/layout/providers";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Manjeet Singh",
  description: "Portfolio of Manjeet Singh, full-stack developer.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3ee" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <a
            href="#main"
            className="bg-accent text-accent-foreground sr-only fixed top-4 left-4 z-[70] rounded-full px-4 py-2 font-mono text-xs focus:not-sr-only"
          >
            Skip to content
          </a>
          <CursorSystem />
          <ScrollProgress />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
