import type { Metadata } from "next"
import { OutfitDetail } from "@/components/outfit/outfit-detail"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Outfit · ${id.slice(0, 8)}` }
}

export default async function OutfitDetailPage({ params }: Props) {
  const { id } = await params
  return <OutfitDetail outfitId={id} />
}
