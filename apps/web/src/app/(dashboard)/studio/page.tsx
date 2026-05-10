import type { Metadata } from "next"
import { GenerationStudio } from "@/components/generation/generation-studio"

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Generate AI outfits, try-on clothes, and design your brand",
}

export default function StudioPage() {
  return <GenerationStudio />
}
