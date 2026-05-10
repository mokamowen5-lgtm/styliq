import type { Metadata } from "next"
import { BoardsCatalog } from "@/components/boards/boards-catalog"

export const metadata: Metadata = {
  title: "Boards",
  description: "Curate your aesthetic — collect, organize, share moodboards",
}

export default function BoardsPage() {
  return <BoardsCatalog />
}
