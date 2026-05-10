import type { Metadata } from "next"
import { MultiFeed } from "@/components/feed/multi-feed"

export const metadata: Metadata = {
  title: "Feed",
  description: "Discover outfits, hashtags, and trends curated for your aesthetic",
}

export default function FeedPage() {
  return <MultiFeed />
}
