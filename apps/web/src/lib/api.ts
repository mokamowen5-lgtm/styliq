import axios, { type AxiosError } from "axios"
import Cookies from "js-cookie"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Inject access token on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = Cookies.get("refresh_token")
        if (!refreshToken) throw new Error("No refresh token")

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
          { refreshToken }
        )

        Cookies.set("access_token", data.accessToken, {
          expires: 1 / 96,
          secure: true,
          sameSite: "strict",
        })

        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        Cookies.remove("access_token")
        Cookies.remove("refresh_token")
        if (typeof window !== "undefined") window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export const apiRoutes = {
  auth: {
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
    google: "/api/v1/auth/google",
    forgotPassword: "/api/v1/auth/forgot-password",
    resetPassword: "/api/v1/auth/reset-password",
    verifyEmail: "/api/v1/auth/verify-email",
  },
  users: {
    me: "/api/v1/users/me",
    profile: (username: string) => `/api/v1/users/${username}`,
    updateProfile: "/api/v1/users/me",
    updateOnboarding: "/api/v1/users/me/onboarding",
    follow: (userId: string) => `/api/v1/users/${userId}/follow`,
    followers: (userId: string) => `/api/v1/users/${userId}/followers`,
    following: (userId: string) => `/api/v1/users/${userId}/following`,
  },
  ai: {
    generateOutfit: "/api/v1/ai/generate/outfit",
    generateTryOn: "/api/v1/ai/generate/tryon",
    generateBrand: "/api/v1/ai/generate/brand",
    generations: "/api/v1/ai/generations",
    generation: (id: string) => `/api/v1/ai/generations/${id}`,
    recommendations: "/api/v1/ai/recommendations",
    trends: "/api/v1/ai/trends",
  },
  outfits: {
    feed: "/api/v1/outfits",
    trending: "/api/v1/outfits/trending",
    create: "/api/v1/outfits",
    detail: (id: string) => `/api/v1/outfits/${id}`,
    like: (id: string) => `/api/v1/outfits/${id}/like`,
    save: (id: string) => `/api/v1/outfits/${id}/save`,
    comments: (id: string) => `/api/v1/outfits/${id}/comments`,
  },
  products: {
    list: "/api/v1/products",
    detail: (id: string) => `/api/v1/products/${id}`,
    search: "/api/v1/products/search",
  },
  subscriptions: {
    current: "/api/v1/subscriptions/me",
    checkout: "/api/v1/subscriptions/checkout",
    portal: "/api/v1/subscriptions/portal",
  },
  notifications: {
    list: "/api/v1/notifications",
    markRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllRead: "/api/v1/notifications/read-all",
  },
}
