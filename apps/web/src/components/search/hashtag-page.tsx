"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Hash, TrendingUp, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { styliqRoutes } from "@/lib/api-styliq"
import { formatNumber } from "@/lib/utils"
import { OutfitCard } from "@/components/feed/outfit-card"

export function HashtagPage({ tag }: { tag: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hashtag-outfits", tag],
    queryFn: async () => {
      const { data } = await api.get(styliqRoutes.hashtags.outfits(tag))
      return data
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black">#{tag}</h1>
              {data?.hashtag?.isTrending && (
                <span className="inline-flex items-center gap-1 badge bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] mt-1">
                  <TrendingUp className="w-2.5 h-2.5" />
                  Trending now
                </span>
              )}
            </div>
          </div>
          {data?.total !== undefined && (
            <p className="text-sm text-white/40">
              {formatNumber(data.total)} outfits
            </p>
          )}
        </div>

        <button className="btn-primary px-5 py-2.5 text-sm">
          <Plus className="w-3.5 h-3.5" />
          Follow
        </button>
      </motion.div>

      {/* Outfits */}
      {isLoading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : data?.items?.length > 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {data.items.map((outfit: any) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 space-y-2">
          <div className="text-4xl">🤷</div>
          <p className="text-white/40">No outfits with this hashtag yet</p>
        </div>
      )}
    </div>
  )
}
