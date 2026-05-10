/**
 * Styliq-specific API routes (boards, hashtags, search, recommendation).
 * Re-exports from main api.ts.
 */
export const styliqRoutes = {
  boards: {
    list: "/api/v1/boards",
    detail: (id: string) => `/api/v1/boards/${id}`,
    items: (id: string) => `/api/v1/boards/${id}/items`,
    create: "/api/v1/boards",
    update: (id: string) => `/api/v1/boards/${id}`,
    delete: (id: string) => `/api/v1/boards/${id}`,
    addItem: (id: string) => `/api/v1/boards/${id}/items`,
    removeItem: (id: string, outfitId: string) => `/api/v1/boards/${id}/items/${outfitId}`,
    reorder: (id: string) => `/api/v1/boards/${id}/reorder`,
    invite: (id: string) => `/api/v1/boards/${id}/collaborators`,
    acceptInvite: (id: string) => `/api/v1/boards/${id}/collaborators/accept`,
  },
  hashtags: {
    trending: "/api/v1/hashtags/trending",
    search: "/api/v1/hashtags/search",
    detail: (tag: string) => `/api/v1/hashtags/${tag}`,
    outfits: (tag: string) => `/api/v1/hashtags/${tag}/outfits`,
  },
  search: {
    universal: "/api/v1/search",
    autocomplete: "/api/v1/search/autocomplete",
    visual: "/api/v1/search/visual",
    history: "/api/v1/search/history",
  },
  recommendation: {
    feed: "/api/v1/recommendation/feed",
    track: "/api/v1/recommendation/track",
    recompute: "/api/v1/recommendation/recompute-my-embedding",
  },
} as const

export type FeedType =
  | "FOR_YOU"
  | "FOLLOWING"
  | "TRENDING"
  | "LUXURY"
  | "STREETWEAR"
  | "MINIMAL"
  | "SNEAKERS"
  | "AI_GENERATED"
  | "MOODBOARDS"
  | "DISCOVER"
