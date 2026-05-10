"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search, Camera, X, TrendingUp, Hash, User, Layout,
  Image as ImageIcon, Clock, Sparkles, ArrowUp,
} from "lucide-react"
import { api } from "@/lib/api"
import { styliqRoutes } from "@/lib/api-styliq"
import { cn, formatNumber, getInitials } from "@/lib/utils"
import { OutfitCard } from "@/components/feed/outfit-card"

const TABS = [
  { id: "all", label: "All" },
  { id: "outfits", label: "Outfits" },
  { id: "creators", label: "Creators" },
  { id: "hashtags", label: "Hashtags" },
  { id: "boards", label: "Boards" },
] as const

export function SearchExperience() {
  const router = useRouter()
  const params = useSearchParams()
  const initialQuery = params.get("q") ?? ""

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("all")
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(t)
  }, [query])

  // Update URL
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false })
    }
  }, [debouncedQuery, router])

  // Autocomplete
  const { data: suggestions } = useQuery({
    queryKey: ["search-autocomplete", query],
    queryFn: async () => {
      const { data } = await api.get(`${styliqRoutes.search.autocomplete}?q=${encodeURIComponent(query)}`)
      return data
    },
    enabled: showSuggestions,
  })

  // Universal results
  const { data: results, isLoading } = useQuery({
    queryKey: ["search-results", debouncedQuery, tab],
    queryFn: async () => {
      const { data } = await api.get(
        `${styliqRoutes.search.universal}?q=${encodeURIComponent(debouncedQuery)}&limit=24`
      )
      return data
    },
    enabled: debouncedQuery.length >= 2,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search styles, creators, hashtags…"
          className="input pl-14 pr-32 text-base py-4 rounded-2xl"
          autoFocus
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery("")}
              className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => router.push("/search/visual")}
            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visual</span>
          </button>
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden shadow-card z-50 max-h-[420px] overflow-y-auto scrollbar-thin"
            >
              {/* Trending if no query */}
              {!query && suggestions?.trending?.length > 0 && (
                <div className="p-2">
                  <SectionHeader icon={TrendingUp} label="Trending now" />
                  {suggestions.trending.map((s: any) => (
                    <SuggestionRow
                      key={s.text}
                      icon={TrendingUp}
                      label={s.text}
                      meta={s.meta}
                      onClick={() => setQuery(s.text)}
                    />
                  ))}
                </div>
              )}

              {/* Hashtag suggestions */}
              {suggestions?.hashtags?.length > 0 && (
                <div className="p-2 border-t border-white/[0.04]">
                  <SectionHeader icon={Hash} label="Hashtags" />
                  {suggestions.hashtags.map((s: any) => (
                    <SuggestionRow
                      key={s.text}
                      icon={Hash}
                      label={s.text}
                      meta={s.meta}
                      onClick={() => router.push(`/h/${s.text.replace(/^#/, "")}`)}
                    />
                  ))}
                </div>
              )}

              {/* User suggestions */}
              {suggestions?.users?.length > 0 && (
                <div className="p-2 border-t border-white/[0.04]">
                  <SectionHeader icon={User} label="Creators" />
                  {suggestions.users.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/profile/${s.sub.replace(/^@/, "")}`)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {s.avatarUrl ? (
                          <img src={s.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(s.text)
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-white truncate">{s.text}</p>
                          {s.verified && (
                            <svg className="w-3 h-3 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 truncate">{s.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent searches */}
              {suggestions?.recent?.length > 0 && (
                <div className="p-2 border-t border-white/[0.04]">
                  <SectionHeader icon={Clock} label="Recent" />
                  {suggestions.recent.map((s: any) => (
                    <SuggestionRow
                      key={s.text}
                      icon={Clock}
                      label={s.text}
                      onClick={() => setQuery(s.text)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      {debouncedQuery.length >= 2 && (
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] w-fit mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-gradient-brand text-white shadow-glow-sm"
                  : "text-white/40 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {debouncedQuery.length < 2 ? (
        <DiscoverState />
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : results ? (
        <ResultsGrid results={results} tab={tab} />
      ) : null}
    </div>
  )
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
      <Icon className="w-3 h-3" />
      {label}
    </div>
  )
}

function SuggestionRow({
  icon: Icon, label, meta, onClick,
}: {
  icon: React.ElementType
  label: string
  meta?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 flex items-center gap-3 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
    >
      <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
      <span className="flex-1 text-sm text-white truncate">{label}</span>
      {meta && <span className="text-[10px] text-white/30 flex-shrink-0">{meta}</span>}
      <ArrowUp className="w-3 h-3 text-white/20 -rotate-45" />
    </button>
  )
}

function ResultsGrid({ results, tab }: { results: any; tab: string }) {
  const showOutfits = tab === "all" || tab === "outfits"
  const showUsers = tab === "all" || tab === "creators"
  const showHashtags = tab === "all" || tab === "hashtags"
  const showBoards = tab === "all" || tab === "boards"

  return (
    <div className="space-y-10">
      {showHashtags && results.hashtags?.length > 0 && (
        <section>
          <SectionTitle icon={Hash} label="Hashtags" />
          <div className="flex flex-wrap gap-2">
            {results.hashtags.map((h: any) => (
              <Link
                key={h.id}
                href={`/h/${h.tag}`}
                className="badge-brand px-4 py-2 text-sm hover:bg-white/20 transition-colors"
              >
                #{h.tag}
                <span className="text-white/50">· {formatNumber(h.postsCount)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showUsers && results.users?.length > 0 && (
        <section>
          <SectionTitle icon={User} label="Creators" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.users.map((u: any) => (
              <Link
                key={u.id}
                href={`/profile/${u.username}`}
                className="card-hover p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(u.displayName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-white truncate">{u.displayName}</p>
                    {u.isVerified && (
                      <svg className="w-3 h-3 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">@{u.username}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{formatNumber(u.followersCount)} followers</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showBoards && results.boards?.length > 0 && (
        <section>
          <SectionTitle icon={Layout} label="Boards" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.boards.map((b: any) => (
              <Link key={b.id} href={`/boards/${b.id}`} className="card-hover overflow-hidden">
                <div className="aspect-[4/3] grid grid-cols-2 grid-rows-2 gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/[0.04]">
                      {b.items?.[i]?.outfit?.thumbnailUrl && (
                        <img src={b.items[i].outfit.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-white truncate">{b.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">@{b.owner?.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showOutfits && results.outfits?.length > 0 && (
        <section>
          <SectionTitle icon={ImageIcon} label="Outfits" />
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {results.outfits.map((outfit: any) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
        </section>
      )}

      {results.total === 0 && (
        <div className="text-center py-24 space-y-2">
          <div className="text-4xl">🤷</div>
          <p className="text-white/40">No results found</p>
          <p className="text-xs text-white/25">Try a different search term or use Visual Search</p>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  )
}

function DiscoverState() {
  return (
    <div className="text-center py-24 space-y-3">
      <div className="text-5xl">🔍</div>
      <h3 className="font-semibold text-white/50">Discover anything</h3>
      <p className="text-sm text-white/30 max-w-md mx-auto">
        Search for styles, hashtags, creators, boards. Or upload an image to find similar looks.
      </p>
    </div>
  )
}
