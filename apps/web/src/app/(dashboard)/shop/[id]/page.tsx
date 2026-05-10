import { ProductDetail } from "@/components/shop/product-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  return <ProductDetail productId={id} />
}
