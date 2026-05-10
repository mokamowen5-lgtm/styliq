"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Heart, Bookmark, Share2, MessageCircle, TrendingUp } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatNumber, formatRelativeTime, getInitials } from "@/lib/utils"
import type { Outfit } from "@stylesnap/types"

interface OutfitCardProps {
  outfit: Outfit
  priority?: boolean
}

export function OutfitCard({ outfit, priority = false }: OutfitCardProps) {
  const [liked, setLiked] = useState(outfit.isLiked ?? false)
  const [saved, setSaved] = useState(outfit.isSaved ?? false)
  const [likesCount, setLikesCount] = useState(outfit.likesCount)
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.outfits.like(outfit.id)),
    onMutate: () => {
      setLiked((p) => !p)
      setLikesCount((p) => p + (liked ? -1 : 1))
    },
    onError: () => {
      setLiked((p) => !p)
      setLikesCount((p) => p + (liked ? 1 : -1))
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.outfits.save(outfit.id)),
    onMutate: () => setSaved((p) => !p),
    onError: () => setSaved((p) => !p),
  })

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="break-inside-avoid mb-3"
    >
      <Link href={`/outfits/${outfit.id}`}>
        <div className="group relative rounded-2xl overflow-hidden cursor-pointer bg-zinc-900">
          {/* Image */}
          <div className="relative overflow-hidden">
            <img
              src={outfit.thumbnailUrl ?? outfit.imageUrl}
              alt={outfit.title}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
            />

            {/* Trending badge */}
            {outfit.isTrending && (
              <div className="absolute top-2 left-2 glass rounded-lg px-2 py-1 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">Trending</span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Action buttons */}
            <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  likeMutation.mutate()
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all",
                  liked
                    ? "bg-red-500 text-white"
                    : "bg-black/50 text-white hover:bg-red-500"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault()
                  saveMutation.mutate()
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all",
                  saved
                    ? "bg-white text-white"
                    : "bg-black/50 text-white hover:bg-white"
                )}
              >
                <Bookmark className={cn("w-3.5 h-3.5", saved && "fill-current")} />
              </button>
            </div>
          </div>

          {/* Card footer */}
          <div className="p-3 space-y-2">
            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {outfit.user.avatarUrl ? (
                  <img
                    src={outfit.user.avatarUrl}
                    alt={outfit.user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(outfit.user.displayName)
                )}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs font-medium text-white/70 truncate">
                  {outfit.user.displayName}
                </span>
                {outfit.user.isVerified && (
                  <svg className="w-3 h-3 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-[11px] text-white/30">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {formatNumber(likesCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> {formatNumber(outfit.commentsCount)}
              </span>
              <span className="ml-auto">{formatRelativeTime(outfit.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
