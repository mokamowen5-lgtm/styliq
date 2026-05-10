"use client"

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { TrendingUp, Flame, ArrowUp, Sparkles, Hash } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatNumber, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import { OutfitCard } from "./outfit-card"
import type { Outfit, CursorPaginatedResponse } from "@stylesnap/types"

export function TrendingPage() {
  // Style trends from /api/v1/ai/trends
  const { data: trends } = useQuery({
    queryKey: ["trends"],
    queryFn: async () => (await api.get(apiRoutes.ai.trends)).data,
  })

  // Trending outfits feed
  const { data: outfitsData } = useInfiniteQuery({
    queryKey: ["trending-outfits"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20", trending: "true" })
      if (pageParam) params.set("cursor", pageParam)
      const { data } = await api.get(`${apiRoutes.outfits.feed}?${params}`)
      return data as CursorPaginatedResponse<Outfit>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const outfits = outfitsData?.pages.flatMap((p) => p.items) ?? []
  const top3 = outfits.slice(0, 3)
  const rest = outfits.slice(3)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 badge-brand text-xs">
          <Flame className="w-3 h-3" />
          Live trends
        </div>
        <h1 className="text-3xl font-display font-black">
          What's <span className="gradient-text">hot</span> right now
        </h1>
        <p className="text-white/40 text-sm">
          Real-time style intelligence from TikTok, Instagram & Pinterest
        </p>
      </div>

      {/* Trending styles */}
      {trends && trends.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">
              Trending Aesthetics
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trends.slice(0, 6).map((trend: any, i: number) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/feed?style=${trend.category}`}
                  className="card-hover p-4 block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{STYLE_EMOJIS[trend.category] ?? "✨"}</span>
                    <span className="badge bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      <ArrowUp className="w-2.5 h-2.5" />
                      +{Math.round(trend.growthRate * 100)}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{trend.name}</h3>
                  <p className="text-xs text-white/40 line-clamp-2">
                    {trend.description}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                    <span className="text-[10px] uppercase tracking-wider text-white/30">
                      via {trend.source}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] text-white font-mono">
                        {(trend.trendScore * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Top 3 viral outfits */}
      {top3.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">
              Viral Right Now
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {top3.map((outfit, i) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <Link href={`/outfits/${outfit.id}`} className="block group">
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={outfit.thumbnailUrl ?? outfit.imageUrl}
                      alt={outfit.title}
                      className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Rank badge */}
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center font-black text-white shadow-glow-sm">
                      #{i + 1}
                    </div>

                    {/* Virality */}
                    <div className="absolute top-3 right-3 glass rounded-lg px-2 py-1 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">
                        {Math.round(outfit.viralityScore * 100)}%
                      </span>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12">
                      <p className="text-xs font-bold text-white truncate">{outfit.title}</p>
                      <p className="text-[10px] text-white/60 mt-0.5">@{outfit.user.username}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All trending outfits */}
      {rest.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">
              Trending Outfits
            </h2>
          </div>

          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {rest.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
