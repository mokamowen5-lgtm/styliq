"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Plus, Sparkles, Lock, Users, Eye, Loader2, X, Image as ImageIcon, Wand2,
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { api } from "@/lib/api"
import { styliqRoutes } from "@/lib/api-styliq"
import { cn, formatNumber, getInitials } from "@/lib/utils"

const BOARD_CATEGORIES = [
  { value: "MOODBOARD", label: "Moodboard", emoji: "🎨" },
  { value: "OUTFITS", label: "Outfits", emoji: "👗" },
  { value: "WISHLIST", label: "Wishlist", emoji: "✨" },
  { value: "INSPIRATION", label: "Inspiration", emoji: "💡" },
  { value: "COLLECTIONS", label: "Collections", emoji: "📦" },
  { value: "SEASONAL", label: "Seasonal", emoji: "🍂" },
  { value: "TRAVEL", label: "Travel", emoji: "✈️" },
  { value: "EVENTS", label: "Events", emoji: "🎉" },
] as const

const VISIBILITY_ICONS = {
  PRIVATE: Lock,
  PUBLIC: Eye,
  COLLAB: Users,
  SECRET: Lock,
}

export function BoardsCatalog() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [tab, setTab] = useState<"mine" | "discover">("mine")

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/v1/users/me")).data,
  })

  const { data: boardsData, isLoading } = useQuery({
    queryKey: ["boards", tab, me?.id, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "30" })
      if (tab === "mine" && me?.id) params.set("ownerId", me.id)
      if (filterCategory) params.set("category", filterCategory)
      const { data } = await api.get(`${styliqRoutes.boards.list}?${params}`)
      return data
    },
    enabled: !!me?.id || tab === "discover",
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-black">
            Your <span className="gradient-text">boards</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Collect inspiration, build moodboards, share collections
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          New board
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] w-fit mb-4">
        {([
          { id: "mine", label: "My boards" },
          { id: "discover", label: "Discover" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              tab === t.id
                ? "bg-gradient-brand text-white shadow-glow-sm"
                : "text-white/40 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterCategory(null)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            !filterCategory
              ? "border-white/40 bg-white/10 text-white"
              : "border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
          )}
        >
          All
        </button>
        {BOARD_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(filterCategory === cat.value ? null : cat.value)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
              filterCategory === cat.value
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
            )}
          >
            <span className="mr-1.5">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      ) : boardsData?.items?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {boardsData.items.map((board: any, i: number) => (
            <BoardCard key={board.id} board={board} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState onCreate={() => setCreateOpen(true)} isOwn={tab === "mine"} />
      )}

      <CreateBoardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false)
          queryClient.invalidateQueries({ queryKey: ["boards"] })
        }}
      />
    </div>
  )
}

function BoardCard({ board, index }: { board: any; index: number }) {
  const VisIcon = VISIBILITY_ICONS[board.visibility as keyof typeof VISIBILITY_ICONS] ?? Eye
  const items = board.items ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/boards/${board.id}`} className="group block">
        {/* Cover collage */}
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-900 mb-3">
          {board.coverImageUrl ? (
            <img src={board.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
              {/* Big tile */}
              <div className="row-span-2 relative">
                {items[0]?.outfit?.thumbnailUrl ? (
                  <img
                    src={items[0].outfit.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/[0.06]" />
                )}
              </div>
              {/* Small tiles */}
              {[1, 2].map((i) => (
                <div key={i} className="relative bg-zinc-900">
                  {items[i]?.outfit?.thumbnailUrl ? (
                    <img
                      src={items[i].outfit.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/[0.04]" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white/15" />
            </div>
          )}

          {/* Smart badge */}
          {board.isSmart && (
            <div className="absolute top-2 left-2 glass rounded-lg px-2 py-1 flex items-center gap-1 backdrop-blur-md">
              <Wand2 className="w-3 h-3 text-white" />
              <span className="text-[10px] font-semibold text-white">Smart</span>
            </div>
          )}

          {/* Visibility badge */}
          {board.visibility !== "PUBLIC" && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <VisIcon className="w-3 h-3 text-white/80" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Item count */}
          <div className="absolute bottom-2 left-2 glass rounded-lg px-2 py-1 backdrop-blur-md">
            <span className="text-[10px] font-semibold text-white">
              {board._count?.items ?? board.itemsCount ?? 0} items
            </span>
          </div>
        </div>

        <div className="space-y-1 px-1">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-white transition-colors">
            {board.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/30">
            {board.owner && (
              <span className="truncate">@{board.owner.username}</span>
            )}
            <span>·</span>
            <span>{formatNumber(board.followersCount)} followers</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function EmptyState({ onCreate, isOwn }: { onCreate: () => void; isOwn: boolean }) {
  return (
    <div className="text-center py-24 space-y-3">
      <div className="text-5xl">📌</div>
      <h3 className="font-semibold text-white/50">
        {isOwn ? "No boards yet" : "No public boards in this category"}
      </h3>
      <p className="text-sm text-white/30 max-w-sm mx-auto">
        {isOwn
          ? "Create your first board to start collecting outfits, building moodboards, and curating your aesthetic."
          : "Try another category or create your own."}
      </p>
      {isOwn && (
        <button onClick={onCreate} className="btn-primary text-sm px-5 py-2.5 mt-4 inline-flex">
          <Plus className="w-3.5 h-3.5" />
          Create your first board
        </button>
      )}
    </div>
  )
}

function CreateBoardDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "MOODBOARD" as string,
    visibility: "PUBLIC" as string,
  })

  const mutation = useMutation({
    mutationFn: () => api.post(styliqRoutes.boards.create, form),
    onSuccess: () => {
      setForm({ name: "", description: "", category: "MOODBOARD", visibility: "PUBLIC" })
      onCreated()
    },
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
              >
                <div className="glass rounded-3xl p-6 mx-4 space-y-5">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-display font-bold">
                      New board
                    </Dialog.Title>
                    <Dialog.Close className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </Dialog.Close>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (form.name.trim()) mutation.mutate()
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-semibold text-white/60 mb-1.5 block">
                        Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Summer in Tokyo"
                        className="input"
                        autoFocus
                        maxLength={120}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/60 mb-1.5 block">
                        Description (optional)
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="What's this board about?"
                        className="input resize-none"
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/60 mb-2 block">
                        Category
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {BOARD_CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                            className={cn(
                              "p-2 rounded-xl border text-center transition-all",
                              form.category === cat.value
                                ? "border-white/40 bg-white/[0.06]"
                                : "border-white/[0.06] hover:bg-white/[0.04]"
                            )}
                          >
                            <div className="text-base">{cat.emoji}</div>
                            <div className="text-[10px] text-white/60 mt-0.5">{cat.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white/60 mb-2 block">
                        Visibility
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["PUBLIC", "PRIVATE", "COLLAB"] as const).map((v) => {
                          const Icon = VISIBILITY_ICONS[v]
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                              className={cn(
                                "py-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all",
                                form.visibility === v
                                  ? "border-white/40 bg-white/[0.06] text-white"
                                  : "border-white/[0.06] text-white/60 hover:bg-white/[0.04]"
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {v.charAt(0) + v.slice(1).toLowerCase()}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!form.name.trim() || mutation.isPending}
                      className="btn-primary w-full py-3 text-sm"
                    >
                      {mutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Create board
                    </button>
                  </form>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
