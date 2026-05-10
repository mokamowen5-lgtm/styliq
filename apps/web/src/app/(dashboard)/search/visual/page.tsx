import type { Metadata } from "next"
import { VisualSearch } from "@/components/search/visual-search"

export const metadata: Metadata = {
  title: "Visual Search",
  description: "Find similar outfits by uploading an image",
}

export default function VisualSearchPage() {
  return <VisualSearch />
}
