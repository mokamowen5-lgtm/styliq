import type { Metadata } from "next"
import { ShopCatalog } from "@/components/shop/shop-catalog"

export const metadata: Metadata = {
  title: "Shop",
  description: "AI-curated fashion pieces from 500+ brands",
}

export default function ShopPage() {
  return <ShopCatalog />
}
