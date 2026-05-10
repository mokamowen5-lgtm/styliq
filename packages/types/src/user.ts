export type UserRole = "USER" | "CREATOR" | "ADMIN" | "SUPER_ADMIN"
export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT"
export type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL"

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  role: UserRole
  isVerified: boolean
  gender: Gender | null
  clothingSize: ClothingSize | null
  favoriteStyles: StyleCategory[]
  fashionLevel: number
  experiencePoints: number
  badges: string[]
  followersCount: number
  followingCount: number
  outfitsCount: number
  onboardingCompleted: boolean
  createdAt: string
}

export interface UserProfile extends User {
  isFollowing?: boolean
  isFollowingYou?: boolean
  subscription?: {
    tier: SubscriptionTier
    status: SubscriptionStatus
  }
}

export interface OnboardingData {
  gender: Gender
  clothingSize: ClothingSize
  shoeSize?: number
  favoriteStyles: StyleCategory[]
  favoriteBrands: string[]
  budgetRange: string
  styleInspirations: string[]
}

// Needed here to avoid circular imports
export type StyleCategory =
  | "STREETWEAR"
  | "LUXURY"
  | "OLD_MONEY"
  | "TECHWEAR"
  | "Y2K"
  | "MINIMAL"
  | "VINTAGE"
  | "ANIME"
  | "CYBERPUNK"
  | "CASUAL"
  | "FORMAL"
  | "ATHLEISURE"
  | "COTTAGECORE"
  | "DARK_ACADEMIA"
  | "COASTAL"

export type SubscriptionTier = "FREE" | "PREMIUM" | "VIP"
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "INCOMPLETE"
  | "PAUSED"
