"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  UserPlus, UserCheck, Settings, Share2, Sparkles, Trophy,
  Grid3x3, Bookmark, Heart, Crown, Zap,
} from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatNumber, getInitials, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import { OutfitCard } from "@/components/feed/outfit-card"
import { AestheticProfileCard } from "./aesthetic-profile-card"
import type { Outfit, CursorPaginatedResponse } from "@stylesnap/types"

interface Props {
  username: string
}

type Tab = "outfits" | "saved" | "liked"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "outfits", label: "Outfits", icon: Grid3x3 },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
]

const TIER_BADGES = {
  PREMIUM: { icon: Zap, label: "Premium", className: "bg-white/10 text-white border-white/20" },
  VIP: { icon: Crown, label: "VIP", className: "bg-white/10 text-white border-white/15" },
}

export function ProfilePage({ username }: Props) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>("outfits")

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.users.profile(username))
      return data
    },
  })

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.users.me)
      return data
    },
  })

  const isOwnProfile = me?.username === username

  const followMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.users.follow(profile?.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
  })

  const { data: outfitsData, isLoading: loadingOutfits } = useInfiniteQuery({
    queryKey: ["profile-outfits", profile?.id, tab],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "24", userId: profile?.id })
      if (pageParam) params.set("cursor", pageParam)
      if (tab === "saved") params.set("saved", "true")
      if (tab === "liked") params.set("liked", "true")
      const { data } = await api.get(`${apiRoutes.outfits.feed}?${params}`)
      return data as CursorPaginatedResponse<Outfit>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!profile?.id,
  })

  const outfits = outfitsData?.pages.flatMap((p) => p.items) ?? []

  if (isLoading) return <ProfileSkeleton />
  if (!profile) return <NotFound />

  const tier = profile.subscription?.tier
  const tierBadge = tier && tier !== "FREE" ? TIER_BADGES[tier as "PREMIUM" | "VIP"] : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Banner */}
      <div className="relative h-40 sm:h-56 rounded-3xl overflow-hidden bg-gradient-brand mb-[-60px]">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-mesh-gradient" />
        )}
      </div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative px-4 sm:px-6"
      >
        <div className="flex items-end justify-between flex-wrap gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-white to-white flex items-center justify-center text-3xl font-bold text-white border-4 border-surface-950">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                getInitials(profile.displayName)
              )}
            </div>
            {profile.fashionLevel > 1 && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-brand border-2 border-surface-950 flex items-center justify-center text-[10px] font-bold">
                LV{profile.fashionLevel}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-3">
            {isOwnProfile ? (
              <Link href="/settings" className="btn-outline text-sm px-4 py-2">
                <Settings className="w-3.5 h-3.5" />
                Edit profile
              </Link>
            ) : (
              <>
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={cn(
                    "text-sm px-5 py-2 transition-all",
                    profile.isFollowing ? "btn-outline" : "btn-primary"
                  )}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Follow
                    </>
                  )}
                </button>
                <button className="btn-outline text-sm px-3 py-2">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-black">{profile.displayName}</h1>
            {profile.isVerified && (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tierBadge && (
              <span className={cn("badge text-[10px] font-semibold border", tierBadge.className)}>
                <tierBadge.icon className="w-3 h-3" />
                {tierBadge.label}
              </span>
            )}
          </div>
          <p className="text-sm text-white/40">@{profile.username}</p>
          {profile.bio && <p className="text-sm text-white/60 max-w-md leading-relaxed">{profile.bio}</p>}

          {/* Style tags */}
          {profile.favoriteStyles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.favoriteStyles.slice(0, 5).map((style: string) => (
                <span
                  key={style}
                  className="badge bg-white/[0.05] text-white/50 border-white/[0.08] text-[10px]"
                >
                  {STYLE_EMOJIS[style]} {STYLE_LABELS[style]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-6 p-4 glass rounded-2xl">
          <Stat label="Outfits" value={profile.outfitsCount ?? 0} />
          <Stat label="Followers" value={profile.followersCount ?? 0} />
          <Stat label="Following" value={profile.followingCount ?? 0} />
          <Stat label="Likes" value={profile.likesReceivedCount ?? 0} />
        </div>

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none">
            <Trophy className="w-4 h-4 text-white flex-shrink-0" />
            {profile.badges.map((badge: string) => (
              <span
                key={badge}
                className="badge bg-white/[0.06] text-white border-white/10 text-[10px] flex-shrink-0"
              >
                {badge.replace("_", " ")}
              </span>
            ))}
          </div>
        )}

        {/* Aesthetic profile */}
        <div className="mt-8">
          <AestheticProfileCard username={username} isOwnProfile={isOwnProfile} />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-1 border-b border-white/[0.06]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all",
                tab === t.id
                  ? "border-white text-white"
                  : "border-transparent text-white/40 hover:text-white"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Outfits grid */}
        <div className="mt-6">
          {loadingOutfits ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : outfits.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Sparkles className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm">
                {isOwnProfile
                  ? `You haven't ${tab === "saved" ? "saved" : tab === "liked" ? "liked" : "posted"} any outfits yet`
                  : `No ${tab} yet`}
              </p>
              {isOwnProfile && (
                <Link href="/studio" className="btn-primary text-sm px-5 py-2.5 inline-flex">
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate your first outfit
                </Link>
              )}
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {outfits.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-white">{formatNumber(value)}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="skeleton h-56 rounded-3xl" />
      <div className="flex gap-4 px-6 -mt-12">
        <div className="skeleton w-28 h-28 rounded-3xl" />
        <div className="flex-1 space-y-2 mt-12">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
      <div className="text-5xl">🤷</div>
      <h2 className="text-xl font-display font-bold">User not found</h2>
      <Link href="/feed" className="btn-primary text-sm px-5 py-2.5 mt-3">
        Back to feed
      </Link>
    </div>
  )
}
