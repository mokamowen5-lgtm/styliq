import { BoardDetail } from "@/components/boards/board-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function BoardDetailPage({ params }: Props) {
  const { id } = await params
  return <BoardDetail boardId={id} />
}
