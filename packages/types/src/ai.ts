import type { StyleCategory } from "./user"

export type GenerationMode =
  | "OUTFIT"
  | "VIRTUAL_TRYON"
  | "BRAND_DESIGN"
  | "LOGO"
  | "COLLECTION"

export type GenerationStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "QUEUED"

export interface AiGeneration {
  id: string
  userId: string
  mode: GenerationMode
  status: GenerationStatus
  inputImageUrl: string | null
  inputPrompt: string | null
  styleCategory: StyleCategory | null
  creativity: number
  outputImages: string[]
  selectedIndex: number | null
  metadata: Record<string, unknown> | null
  errorMessage: string | null
  generationTime: number | null
  createdAt: string
}

export interface GenerateOutfitRequest {
  inputImageUrl?: string
  styleCategory: StyleCategory
  creativity?: number
  mode?: "standard" | "viral_tiktok" | "luxury" | "budget" | "designer"
  generateVariants?: number
}

export interface VirtualTryOnRequest {
  personImageUrl: string
  garmentImageUrl: string
  garmentType: "top" | "bottom" | "dress" | "outerwear"
}

export interface BrandDesignRequest {
  type: "hoodie" | "tshirt" | "sneakers" | "logo" | "collection"
  prompt: string
  styleCategory?: StyleCategory
  colorPalette?: string[]
  inspirations?: string[]
}

export interface StyleRecommendation {
  outfitId: string
  imageUrl: string
  score: number
  reason: string
  styleCategories: StyleCategory[]
}

export interface TrendAnalysis {
  trending: Array<{
    style: StyleCategory
    score: number
    growthRate: number
    hashtags: string[]
    imageUrls: string[]
  }>
  personal: StyleRecommendation[]
  viral: StyleRecommendation[]
}
