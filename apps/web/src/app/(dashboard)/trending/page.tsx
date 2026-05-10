import type { Metadata } from "next"
import { TrendingPage } from "@/components/feed/trending-page"

export const metadata: Metadata = {
  title: "Trending",
  description: "Discover trending styles and viral outfits",
}

export default function Trending() {
  return <TrendingPage />
}
