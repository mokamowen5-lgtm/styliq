import type { Metadata } from "next"
import { SearchExperience } from "@/components/search/search-experience"

export const metadata: Metadata = {
  title: "Search",
  description: "Find outfits, creators, hashtags & boards",
}

export default function SearchPage() {
  return <SearchExperience />
}
