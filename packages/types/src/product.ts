import type { StyleCategory } from "./user"

export type ProductCategory =
  | "TOPS"
  | "BOTTOMS"
  | "DRESSES"
  | "OUTERWEAR"
  | "SHOES"
  | "ACCESSORIES"
  | "BAGS"
  | "JEWELRY"
  | "SPORTSWEAR"
  | "UNDERWEAR"
  | "SWIMWEAR"

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  category: ProductCategory
  styles: StyleCategory[]
  tags: string[]
  brand: string | null
  images: string[]
  thumbnailUrl: string | null
  price: number
  comparePrice: number | null
  currency: string
  sizes: string[]
  colors: ProductColor[]
  stock: number
  isAvailable: boolean
  affiliateUrl: string | null
  rating: number | null
  reviewsCount: number
  viewsCount: number
  purchasesCount: number
  createdAt: string
}

export interface ProductColor {
  id: string
  name: string
  hex: string
  imageUrl: string | null
  stock: number
}

export interface CartItem {
  product: Product
  quantity: number
  size: string
  color: string
}

export interface Order {
  id: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  shippingAmount: number
  taxAmount: number
  total: number
  currency: string
  trackingNumber: string | null
  createdAt: string
}

export interface OrderItem {
  id: string
  productId: string
  product: Pick<Product, "id" | "name" | "thumbnailUrl">
  quantity: number
  size: string | null
  color: string | null
  unitPrice: number
  totalPrice: number
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
