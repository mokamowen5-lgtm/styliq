import type { SubscriptionTier, SubscriptionStatus } from "./user"

export interface Subscription {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  generationsUsedToday: number
  totalGenerations: number
  createdAt: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: SubscriptionTier
  price: number
  currency: string
  interval: "month" | "year"
  features: string[]
  limits: {
    dailyGenerations: number | null
    quality: "standard" | "hd" | "ultra"
    virtualTryOn: boolean
    brandTools: boolean
    noWatermark: boolean
    analytics: boolean
  }
  stripePriceId: string
  isPopular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    tier: "FREE",
    price: 0,
    currency: "eur",
    interval: "month",
    stripePriceId: "",
    features: [
      "5 AI generations / day",
      "Standard quality",
      "Social feed access",
      "Basic outfit saving",
    ],
    limits: {
      dailyGenerations: 5,
      quality: "standard",
      virtualTryOn: false,
      brandTools: false,
      noWatermark: false,
      analytics: false,
    },
  },
  {
    id: "premium",
    name: "Premium",
    tier: "PREMIUM",
    price: 900,
    currency: "eur",
    interval: "month",
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    isPopular: true,
    features: [
      "Unlimited AI generations",
      "HD quality output",
      "Advanced virtual try-on",
      "Export without watermark",
      "Advanced AI styling",
      "Priority generation queue",
    ],
    limits: {
      dailyGenerations: null,
      quality: "hd",
      virtualTryOn: true,
      brandTools: false,
      noWatermark: true,
      analytics: false,
    },
  },
  {
    id: "vip",
    name: "VIP",
    tier: "VIP",
    price: 2900,
    currency: "eur",
    interval: "month",
    stripePriceId: process.env.STRIPE_VIP_PRICE_ID ?? "",
    features: [
      "Everything in Premium",
      "Ultra-fast generation",
      "Brand design tools",
      "Trend analytics dashboard",
      "Dropshipping integration",
      "Creator marketplace access",
      "Dedicated support",
    ],
    limits: {
      dailyGenerations: null,
      quality: "ultra",
      virtualTryOn: true,
      brandTools: true,
      noWatermark: true,
      analytics: true,
    },
  },
]
