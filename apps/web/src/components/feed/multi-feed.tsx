"use client"

import { useState, useEffect, useRef } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, TrendingUp, Users, Crown, Shirt, Square,
  Footprints, Wand2, Layout, Compass,
} from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { styliqRoutes, type FeedType } from "@/lib/api-styliq"
import { cn } from "@/lib/utils"
import { OutfitCard } from "./outfit-card"
import type { Outfit, CursorPaginatedResponse } from "@stylesnap/types"

const FEED_TABS: { id: FeedType; label: string; icon: React.ElementType; color: string }[] = [
  { id: "FOR_YOU", label: "For You", icon: Sparkles, color: "from-white to-white" },
  { id: "FOLLOWING", label: "Following", icon: Users, color: "from-white to-zinc-300" },
  { id: "TRENDING", label: "Trending", icon: TrendingUp, color: "from-white to-zinc-300" },
  { id: "DISCOVER", label: "Discover", icon: Compass, color: "from-white to-rose-500" },
  { id: "LUXURY", label: "Luxury", icon: Crown, color: "from-white to-orange-500" },
  { id: "STREETWEAR", label: "Streetwear", icon: Shirt, color: "from-orange-500 to-red-500" },
  { id: "MINIMAL", label: "Minimal", icon: Square, color: "from-slate-400 to-slate-600" },
  { id: "SNEAKERS", label: "Sneakers", icon: Footprints, color: "from-white to-indigo-500" },
  { id: "AI_GENERATED", label: "AI Made", icon: Wand2, color: "from-white to-purple-500" },
  { id: "MOODBOARDS", label: "Moodboards", icon: Layout, color: "from-white to-white" },
]

export function MultiFeed() {
  const [activeFeed, setActiveFeed] = useState<FeedType>("FOR_YOU")
  const sessionId = useRef<string>(`s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).current

  // Personalized feed via recommendation engine for FOR_YOU + DISCOVER
  const usesReco = activeFeed === "FOR_YOU" || activeFeed === "DISCOVER"

  const recoQuery = useQuery({
    queryKey: ["reco-feed", activeFeed],
    queryFn: async () => {
      const { data } = await api.get(`${styliqRoutes.recommendation.feed}?type=${activeFeed}&limit=30`)
      return data
    },
    enabled: usesReco,
  })

  // Hydrate full outfits from IDs returned by reco
  const recoOutfits = useQuery({
    queryKey: ["reco-outfits-hydrated", recoQuery.data?.outfitIds],
    queryFn: async () => {
      if (!recoQuery.data?.outfitIds?.length) return []
      // Batch fetch
      const params = new URLSearchParams({ ids: recoQuery.data.outfitIds.join(",") })
      const { data } = await api.get(`${apiRoutes.outfits.feed}?${params}&limit=30`)
      return (data.items ?? []) as Outfit[]
    },
    enabled: usesReco && !!recoQuery.data?.outfitIds?.length,
  })

  // Standard cursor-paginated feed for the rest
  const standardFeed = useInfiniteQuery({
    queryKey: ["multi-feed", activeFeed],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "24" })
      if (pageParam) params.set("cursor", pageParam)

      // Map feed type to API filters
      switch (activeFeed) {
        case "TRENDING":
          params.set("trending", "true")
          break
        case "FOLLOWING":
          params.set("following", "true")
          break
        case "LUXURY":
          params.set("style", "LUXURY")
          break
        case "STREETWEAR":
          params.set("style", "STREETWEAR")
          break
        case "MINIMAL":
          params.set("style", "MINIMAL")
          break
        case "SNEAKERS":
          params.set("style", "SNEAKERS")
          break
        case "AI_GENERATED":
          params.set("aiOnly", "true")
          break
      }

      const { data } = await api.get(`${apiRoutes.outfits.feed}?${params}`)
      return data as CursorPaginatedResponse<Outfit>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !usesReco,
  })

  const { ref: loadMoreRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && standardFeed.hasNextPage && !standardFeed.isFetchingNextPage) {
        standardFeed.fetchNextPage()
      }
    },
  })

  // Track view event when an outfit enters viewport
  function trackView(outfitId: string, position: number) {
    api.post(styliqRoutes.recommendation.track, {
      outfitId,
      eventType: "VIEW",
      feedType: activeFeed,
      position,
      sessionId,
    }).catch(() => {})
  }

  const outfits: Outfit[] = usesReco
    ? (recoOutfits.data ?? [])
    : (standardFeed.data?.pages.flatMap((p) => p.items) ?? [])

  const isLoading = usesReco
    ? recoQuery.isLoading || recoOutfits.isLoading
    : standardFeed.isLoading

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Pinterest-style horizontal feed selector */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-white/[0.04] mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FEED_TABS.map((feed) => {
            const Icon = feed.icon
            const isActive = activeFeed === feed.id
            return (
              <button
                key={feed.id}
                onClick={() => setActiveFeed(feed.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap flex-shrink-0",
                  isActive
                    ? "border-transparent text-white"
                    : "border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-feed-bg"
                    className={cn("absolute inset-0 rounded-full bg-gradient-to-r shadow-glow-sm", feed.color)}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  {feed.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Feed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFeed}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <MasonrySkeleton />
          ) : outfits.length === 0 ? (
            <EmptyFeed feedType={activeFeed} />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
              {outfits.map((outfit, i) => (
                <ViewportTracker
                  key={outfit.id}
                  outfitId={outfit.id}
                  position={i}
                  onView={trackView}
                >
                  <OutfitCard outfit={outfit} priority={i < 8} />
                </ViewportTracker>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Load more */}
      {!usesReco && (
        <div ref={loadMoreRef} className="h-4 mt-6">
          {standardFeed.isFetchingNextPage && (
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ViewportTracker({
  outfitId, position, onView, children,
}: {
  outfitId: string
  position: number
  onView: (id: string, pos: number) => void
  children: React.ReactNode
}) {
  const { ref } = useInView({
    threshold: 0.5,
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) onView(outfitId, position)
    },
  })

  return <div ref={ref}>{children}</div>
}

function MasonrySkeleton() {
  const heights = [320, 240, 380, 300, 360, 280, 400, 260]
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="skeleton break-inside-avoid rounded-2xl"
          style={{ height: heights[i % heights.length] }}
        />
      ))}
    </div>
  )
}

function EmptyFeed({ feedType }: { feedType: FeedType }) {
  const messages: Partial<Record<FeedType, string>> = {
    FOLLOWING: "Follow some creators to see their outfits here",
    LUXURY: "No luxury outfits yet — be the first to post one",
    SNEAKERS: "No sneaker looks yet",
    MOODBOARDS: "No public moodboards in this feed",
  }
  return (
    <div className="text-center py-24 space-y-3">
      <div className="text-5xl">👗</div>
      <h3 className="font-semibold text-white/50">It's quiet here</h3>
      <p className="text-sm text-white/30 max-w-sm mx-auto">
        {messages[feedType] ?? "Try another feed or generate your own outfit"}
      </p>
    </div>
  )
}
