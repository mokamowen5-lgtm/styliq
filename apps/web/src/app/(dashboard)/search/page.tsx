import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchExperience } from "@/components/search/search-experience"

export const metadata: Metadata = {
  title: "Search",
  description: "Find outfits, creators, hashtags & boards",
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <SearchExperience />
    </Suspense>
  )
}
