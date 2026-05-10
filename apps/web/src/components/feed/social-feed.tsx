"use client"

import { useState, useRef, useCallback } from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, TrendingUp, Users, Filter } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { Outfit, StyleCategory, CursorPaginatedResponse } from "@stylesnap/types"
import { OutfitCard } from "./outfit-card"

type FeedFilter = "for-you" | "trending" | "following"

const FILTERS: { id: FeedFilter; label: string; icon: React.ElementType }[] = [
  { id: "for-you", label: "For You", icon: Sparkles },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "following", label: "Following", icon: Users },
]

const STYLE_FILTERS = Object.keys(STYLE_LABELS) as StyleCategory[]

export function SocialFeed() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("for-you")
  const [styleFilter, setStyleFilter] = useState<StyleCategory | null>(null)
  const queryClient = useQueryClient()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["feed", activeFilter, styleFilter],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: "24",
        ...(pageParam ? { cursor: pageParam as string } : {}),
        ...(activeFilter === "trending" ? { trending: "true" } : {}),
        ...(activeFilter === "following" ? { following: "true" } : {}),
        ...(styleFilter ? { style: styleFilter } : {}),
      })
      const { data } = await api.get(`${apiRoutes.outfits.feed}?${params}`)
      return data as CursorPaginatedResponse<Outfit>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage()
    },
  })

  const outfits = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Filter bar */}
      <div className="space-y-4 mb-8">
        {/* Main filters */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-2xl p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeFilter === f.id
                  ? "bg-gradient-brand text-white shadow-glow-sm"
                  : "text-white/40 hover:text-white"
              )}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>

        {/* Style filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStyleFilter(null)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              !styleFilter
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
            )}
          >
            All Styles
          </button>
          {STYLE_FILTERS.map((style) => (
            <button
              key={style}
              onClick={() => setStyleFilter(styleFilter === style ? null : style)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                styleFilter === style
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
              )}
            >
              {STYLE_EMOJIS[style]} {STYLE_LABELS[style]}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      {isLoading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn("skeleton break-inside-avoid rounded-2xl", i % 3 === 0 ? "aspect-[3/4]" : "aspect-square")}
            />
          ))}
        </div>
      ) : outfits.length > 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {outfits.map((outfit, i) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              priority={i < 8}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 space-y-3">
          <div className="text-4xl">👗</div>
          <h3 className="font-semibold text-white/50">No outfits here yet</h3>
          <p className="text-sm text-white/25">
            {activeFilter === "following"
              ? "Follow more creators to see their outfits"
              : "Be the first to generate an outfit in this style"}
          </p>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-4 mt-6">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
