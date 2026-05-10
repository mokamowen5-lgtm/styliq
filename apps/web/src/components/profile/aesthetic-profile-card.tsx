"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Sparkles, TrendingUp, Heart, Bookmark, Clock,
  RefreshCw, Loader2, Crown, Zap,
} from "lucide-react"
import { api } from "@/lib/api"
import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"

interface Props {
  username: string
  isOwnProfile: boolean
}

export function AestheticProfileCard({ username, isOwnProfile }: Props) {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["aesthetic-profile", username],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/aesthetic/user/${username}`)
      return data
    },
  })

  const recomputeMutation = useMutation({
    mutationFn: () => api.post("/api/v1/aesthetic/recompute"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aesthetic-profile", username] }),
  })

  if (isLoading) return <SkeletonCard />
  if (!profile) return null

  const hasArchetype = !!profile.archetypeName

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Hero — archetype */}
      <div className="relative p-6 bg-gradient-to-br from-white/[0.06] via-white/5 to-transparent border-b border-white/[0.06]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                AI Aesthetic Profile
              </p>
              {hasArchetype ? (
                <h3 className="text-xl font-display font-black gradient-text">
                  {profile.archetypeName}
                </h3>
              ) : (
                <h3 className="text-xl font-display font-black text-white/60">
                  Style still emerging
                </h3>
              )}
              {profile.archetypeBio && (
                <p className="text-sm text-white/60 mt-2 max-w-md leading-relaxed">
                  {profile.archetypeBio}
                </p>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => recomputeMutation.mutate()}
              disabled={recomputeMutation.isPending}
              className="btn-ghost text-xs px-3 py-1.5"
              title="Recompute profile"
            >
              {recomputeMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 divide-x divide-white/[0.04] border-b border-white/[0.06]">
        <ScoreCell
          icon={Crown}
          label="Aesthetic"
          value={Math.round(profile.aestheticScore)}
          max={100}
          gradient="from-white to-orange-500"
          tooltip="How distinctive your style is"
        />
        <ScoreCell
          icon={Zap}
          label="Diversity"
          value={Math.round(profile.diversityScore)}
          max={100}
          gradient="from-white to-zinc-300"
          tooltip="Range of styles you explore"
        />
      </div>

      {/* Top styles */}
      {profile.topStyles?.length > 0 && (
        <div className="p-5 space-y-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Top styles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.topStyles.map((style: string, i: number) => (
              <span
                key={style}
                className={cn(
                  "badge text-xs",
                  i === 0
                    ? "bg-gradient-brand text-white border-0 shadow-glow-sm"
                    : "bg-white/[0.06] text-white border border-white/10"
                )}
              >
                {STYLE_EMOJIS[style] ?? "✨"} {STYLE_LABELS[style] ?? style}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top hashtags */}
      {profile.topHashtags?.length > 0 && (
        <div className="p-5 space-y-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Signature hashtags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.topHashtags.map((tag: string) => (
              <span
                key={tag}
                className="badge bg-white/[0.05] text-white/60 border-white/[0.08] text-[10px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats footer */}
      <div className="p-5 grid grid-cols-3 gap-3 text-center">
        <Stat icon={Bookmark} label="Saves" value={profile.totalSaves ?? 0} />
        <Stat icon={Heart} label="Likes" value={profile.totalLikes ?? 0} />
        <Stat
          icon={Clock}
          label="Avg session"
          value={profile.avgSessionMinutes > 0 ? `${profile.avgSessionMinutes.toFixed(0)}m` : "—"}
        />
      </div>
    </motion.div>
  )
}

function ScoreCell({
  icon: Icon, label, value, max, gradient, tooltip,
}: {
  icon: React.ElementType
  label: string
  value: number
  max: number
  gradient: string
  tooltip: string
}) {
  const percent = (value / max) * 100
  return (
    <div className="p-5 space-y-2" title={tooltip}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/40" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-xs text-white/30">/ {max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
        />
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="space-y-0.5">
      <Icon className="w-3.5 h-3.5 text-white/30 mx-auto mb-1" />
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="p-6 space-y-3">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-7 w-48 rounded" />
        <div className="skeleton h-4 w-full rounded" />
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/[0.04] border-y border-white/[0.06]">
        {[1, 2].map((i) => (
          <div key={i} className="p-5 space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-7 w-16 rounded" />
            <div className="skeleton h-1.5 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
