import axios from "axios"
import * as SecureStore from "expo-secure-store"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as any

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token")
        if (!refreshToken) throw new Error("No refresh token")

        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken })
        await SecureStore.setItemAsync("access_token", data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        await SecureStore.deleteItemAsync("access_token")
        await SecureStore.deleteItemAsync("refresh_token")
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
  },
  users: {
    me: "/api/v1/users/me",
    updateProfile: "/api/v1/users/me",
    updateOnboarding: "/api/v1/users/me/onboarding",
  },
  ai: {
    generateOutfit: "/api/v1/ai/generate/outfit",
    generateTryOn: "/api/v1/ai/generate/tryon",
    generations: "/api/v1/ai/generations",
    generation: (id: string) => `/api/v1/ai/generations/${id}`,
    recommendations: "/api/v1/ai/recommendations",
    trends: "/api/v1/ai/trends",
  },
  outfits: {
    feed: "/api/v1/outfits",
    detail: (id: string) => `/api/v1/outfits/${id}`,
    like: (id: string) => `/api/v1/outfits/${id}/like`,
    save: (id: string) => `/api/v1/outfits/${id}/save`,
  },
} as const

