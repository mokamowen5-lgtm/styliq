import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Providers } from "@/components/layout/providers"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: {
    default: "STYLIQ — Curate Your Aesthetic with AI",
    template: "%s · STYLIQ",
  },
  description:
    "Discover, curate and create your aesthetic. STYLIQ is the AI-powered fashion platform — generate outfits, build moodboards, find your style.",
  keywords: [
    "AI fashion", "outfit generator", "moodboard", "fashion AI",
    "outfit ideas", "streetwear", "luxury fashion", "style curation",
    "aesthetic", "fashion tech", "Pinterest fashion", "TikTok fashion",
  ],
  authors: [{ name: "STYLIQ" }],
  creator: "STYLIQ",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://styliq.ai"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://styliq.ai",
    siteName: "STYLIQ",
    title: "STYLIQ — Curate Your Aesthetic with AI",
    description: "AI-powered fashion platform for the next generation",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "STYLIQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "STYLIQ",
    description: "AI-powered fashion platform for the next generation",
    images: ["/og-image.jpg"],
    creator: "@styliq",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-black text-white antialiased font-sans"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
