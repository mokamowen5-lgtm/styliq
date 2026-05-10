"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Heart, Bookmark, Share2, MessageCircle, MoreHorizontal,
  TrendingUp, Sparkles, ShoppingBag, ArrowLeft, Send, Loader2,
} from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatNumber, formatRelativeTime, getInitials, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { Outfit, Comment } from "@stylesnap/types"

interface Props {
  outfitId: string
}

export function OutfitDetail({ outfitId }: Props) {
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState("")

  const { data: outfit, isLoading } = useQuery({
    queryKey: ["outfit", outfitId],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.outfits.detail(outfitId))
      return data as Outfit
    },
  })

  const { data: commentsData } = useQuery({
    queryKey: ["outfit-comments", outfitId],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.outfits.comments(outfitId))
      return data as { items: Comment[]; total: number }
    },
  })

  const likeMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.outfits.like(outfitId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outfit", outfitId] }),
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.outfits.save(outfitId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outfit", outfitId] }),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(apiRoutes.outfits.comments(outfitId), { content }),
    onSuccess: () => {
      setCommentText("")
      queryClient.invalidateQueries({ queryKey: ["outfit-comments", outfitId] })
      queryClient.invalidateQueries({ queryKey: ["outfit", outfitId] })
    },
  })

  if (isLoading) return <OutfitDetailSkeleton />
  if (!outfit) return <NotFoundState />

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </Link>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="relative rounded-3xl overflow-hidden bg-zinc-900 glass">
            <img src={outfit.imageUrl} alt={outfit.title} className="w-full h-auto object-cover" />

            {/* Overlay badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-xs font-semibold text-white">AI Generated</span>
              </div>
              {outfit.isTrending && (
                <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    Trending · {Math.round(outfit.viralityScore * 100)}% viral
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick action bar */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => likeMutation.mutate()}
              className={cn(
                "btn-outline py-3 text-sm transition-all",
                outfit.isLiked && "border-red-500/40 bg-red-500/10 text-red-400"
              )}
            >
              <Heart className={cn("w-4 h-4", outfit.isLiked && "fill-current")} />
              <span className="hidden sm:inline">{formatNumber(outfit.likesCount)}</span>
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              className={cn(
                "btn-outline py-3 text-sm transition-all",
                outfit.isSaved && "border-white/30 bg-white/[0.06] text-white"
              )}
            >
              <Bookmark className={cn("w-4 h-4", outfit.isSaved && "fill-current")} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="btn-outline py-3 text-sm">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="btn-primary py-3 text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Shop</span>
            </button>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* User card */}
          <div className="card p-5">
            <Link href={`/profile/${outfit.user.username}`} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {outfit.user.avatarUrl ? (
                  <img src={outfit.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(outfit.user.displayName)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-white truncate group-hover:text-white transition-colors">
                    {outfit.user.displayName}
                  </span>
                  {outfit.user.isVerified && (
                    <svg className="w-4 h-4 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-white/40">@{outfit.user.username}</p>
              </div>
              <button className="btn-primary text-xs px-4 py-2">Follow</button>
            </Link>
          </div>

          {/* Title + description */}
          <div className="card p-5 space-y-3">
            <h1 className="text-xl font-display font-bold text-white">{outfit.title}</h1>
            {outfit.description && (
              <p className="text-sm text-white/60 leading-relaxed">{outfit.description}</p>
            )}

            {/* Style tags */}
            {outfit.styles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {outfit.styles.map((style) => (
                  <Link
                    key={style}
                    href={`/feed?style=${style}`}
                    className="badge bg-white/[0.06] text-white border-white/10 text-[11px] hover:bg-white/10 transition-colors"
                  >
                    {STYLE_EMOJIS[style]} {STYLE_LABELS[style]}
                  </Link>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-white/30">
              <span>{formatRelativeTime(outfit.createdAt)}</span>
              <div className="flex gap-3">
                <span>{formatNumber(outfit.viewsCount)} views</span>
                <span>{formatNumber(outfit.savesCount)} saves</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-white" />
              <h3 className="font-semibold text-sm">Comments</h3>
              <span className="text-xs text-white/30 ml-auto">
                {commentsData?.total ?? 0}
              </span>
            </div>

            {/* Comment input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (commentText.trim()) commentMutation.mutate(commentText)
              }}
              className="p-3 border-b border-white/[0.06] flex gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                className="input text-sm py-2"
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentMutation.isPending}
                className="btn-primary px-3 py-2 disabled:opacity-50"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Comments list */}
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
              {commentsData?.items?.length === 0 ? (
                <div className="p-8 text-center text-white/30 text-sm">
                  Be the first to comment ✨
                </div>
              ) : (
                commentsData?.items?.map((c) => (
                  <CommentItem key={c.id} comment={c} />
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        <Link href={`/profile/${comment.user.username}`} className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-xs font-bold">
            {comment.user.avatarUrl ? (
              <img src={comment.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(comment.user.displayName)
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              href={`/profile/${comment.user.username}`}
              className="text-xs font-semibold text-white hover:text-white transition-colors"
            >
              {comment.user.displayName}
            </Link>
            <span className="text-[10px] text-white/25">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-white/70 mt-0.5 break-words">{comment.content}</p>
          {comment.replies && comment.replies.length > 0 && (
            <button className="text-[11px] text-white mt-1.5">
              View {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function OutfitDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <div className="skeleton aspect-[3/4] rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
      <div className="text-5xl">🤷</div>
      <h2 className="text-xl font-display font-bold">Outfit not found</h2>
      <p className="text-white/40 text-sm">It may have been deleted or made private.</p>
      <Link href="/feed" className="btn-primary text-sm px-5 py-2.5 mt-3">
        Back to feed
      </Link>
    </div>
  )
}
