import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone", // Optimized for Docker/Vercel deployment
  outputFileTracingRoot: process.cwd().replace(/[\\/]apps[\\/]web$/, ""),
  // Experimental features (PPR, React Compiler, inlineCss) require Next.js canary.
  // Re-enable when stable: https://nextjs.org/docs/app/api-reference/config/next-config-js
  // experimental: {
  //   ppr: true,
  //   reactCompiler: true,
  //   inlineCss: true,
  // },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "cdn.stylesnap.ai" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:4000"}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
