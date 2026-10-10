import type { Metadata, Viewport } from "next";
import { Boldonse, Cabin } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import SiteChrome from "@/components/layout/SiteChrome";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";

// Type pairing from the brand board: Boldonse (display) + Cabin (everything else).
const boldonse = Boldonse({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  adjustFontFallback: false, // Next ships no fallback metrics for Boldonse, so skip the adjusted fallback
  variable: "--font-boldonse",
});

const cabin = Cabin({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cabin",
});

const title = "Nanorout — Goodbye Guesswork, Hello Nanotech";
const description =
  "Nanorout is building the Neuro Information System, where neuroscience, AI and semiconductors meet.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nanorout" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${boldonse.variable} ${cabin.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Marks that JS is running, so entrance animations can hide content before they play. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip-link label" href="#main">
          Skip to content
        </a>
        <SiteChrome />
        <Sidebar />
        <div className="page">
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
        <SmoothScroll />
      </body>
    </html>
  );
}
