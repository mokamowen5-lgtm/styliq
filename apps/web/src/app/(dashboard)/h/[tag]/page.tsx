import { HashtagPage } from "@/components/search/hashtag-page"

interface Props {
  params: Promise<{ tag: string }>
}

export default async function HashtagDetailPage({ params }: Props) {
  const { tag } = await params
  return <HashtagPage tag={tag} />
}
