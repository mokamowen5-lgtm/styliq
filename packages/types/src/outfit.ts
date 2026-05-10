import type { StyleCategory, User } from "./user"

export interface Outfit {
  id: string
  userId: string
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "isVerified">
  title: string
  description: string | null
  imageUrl: string
  thumbnailUrl: string | null
  styles: StyleCategory[]
  tags: string[]
  likesCount: number
  commentsCount: number
  savesCount: number
  sharesCount: number
  viewsCount: number
  viralityScore: number
  isPublic: boolean
  isFeatured: boolean
  isTrending: boolean
  isLiked?: boolean
  isSaved?: boolean
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  userId: string
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl">
  outfitId: string
  parentId: string | null
  content: string
  likesCount: number
  replies?: Comment[]
  createdAt: string
}

export interface FeedFilters {
  styles?: StyleCategory[]
  following?: boolean
  trending?: boolean
  featured?: boolean
  cursor?: string
  limit?: number
}
