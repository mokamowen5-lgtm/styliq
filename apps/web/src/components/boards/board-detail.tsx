"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, MoreHorizontal, Share2, Edit, Lock, Eye, Users,
  Plus, Wand2, X, Trash2, Settings, Sparkles, Check,
} from "lucide-react"
import { api } from "@/lib/api"
import { styliqRoutes } from "@/lib/api-styliq"
import { cn, formatNumber, getInitials, STYLE_LABELS } from "@/lib/utils"
import { SortableBoardGrid } from "./sortable-board-grid"

const VISIBILITY = {
  PRIVATE: { icon: Lock, label: "Private", color: "text-white/40" },
  PUBLIC: { icon: Eye, label: "Public", color: "text-emerald-400" },
  COLLAB: { icon: Users, label: "Collab", color: "text-white" },
  SECRET: { icon: Lock, label: "Secret", color: "text-white" },
}

export function BoardDetail({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/v1/users/me")).data,
  })

  const { data: board, isLoading: loadingBoard } = useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => (await api.get(styliqRoutes.boards.detail(boardId))).data,
  })

  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["board-items", boardId],
    queryFn: async () => (await api.get(styliqRoutes.boards.items(boardId))).data,
  })

  const removeMutation = useMutation({
    mutationFn: (outfitId: string) =>
      api.delete(styliqRoutes.boards.removeItem(boardId, outfitId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-items", boardId] })
      queryClient.invalidateQueries({ queryKey: ["board", boardId] })
    },
  })

  if (loadingBoard) return <BoardSkeleton />
  if (!board) return <NotFound />

  const isOwner = me?.id === board.ownerId
  const visibility = VISIBILITY[board.visibility as keyof typeof VISIBILITY] ?? VISIBILITY.PUBLIC
  const VisIcon = visibility.icon

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/boards"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to boards
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4 mb-8"
      >
        <div className="flex-1 min-w-0 space-y-3">
          {/* Owner */}
          <Link
            href={`/profile/${board.owner.username}`}
            className="inline-flex items-center gap-2 group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-[11px] font-bold">
              {board.owner.avatarUrl ? (
                <img src={board.owner.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(board.owner.displayName)
              )}
            </div>
            <span className="text-xs text-white/50 group-hover:text-white transition-colors">
              @{board.owner.username}
            </span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight">{board.name}</h1>

          {board.description && (
            <p className="text-sm text-white/60 max-w-xl">{board.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
            <span className={cn("flex items-center gap-1", visibility.color)}>
              <VisIcon className="w-3 h-3" />
              {visibility.label}
            </span>
            <span>·</span>
            <span>{board._count?.items ?? board.itemsCount ?? 0} items</span>
            <span>·</span>
            <span>{formatNumber(board.followersCount)} followers</span>
            {board.isSmart && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-white">
                  <Wand2 className="w-3 h-3" />
                  Smart board
                </span>
              </>
            )}
          </div>

          {/* Style tags */}
          {board.styles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {board.styles.map((style: string) => (
                <span
                  key={style}
                  className="badge bg-white/[0.05] text-white/60 border-white/[0.08] text-[10px]"
                >
                  {STYLE_LABELS[style] ?? style}
                </span>
              ))}
            </div>
          )}

          {/* Color palette */}
          {board.colorPalette?.length > 0 && (
            <div className="flex gap-1.5">
              {board.colorPalette.map((color: string) => (
                <div
                  key={color}
                  className="w-5 h-5 rounded-full border border-white/10"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isOwner ? (
            <>
              <button
                onClick={() => setEditMode((p) => !p)}
                className={cn(
                  "btn-outline text-sm px-4 py-2",
                  editMode && "border-white/40 bg-white/[0.06] text-white"
                )}
              >
                {editMode ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                {editMode ? "Done" : "Edit"}
              </button>
              <button className="btn-outline w-10 h-9 p-0 justify-center">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button className="btn-primary text-sm px-5 py-2">
              Follow
            </button>
          )}
          <button className="btn-outline w-10 h-9 p-0 justify-center">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Collaborators */}
      {board.collaborators?.length > 0 && (
        <div className="flex items-center gap-2 mb-6 text-xs text-white/40">
          <Users className="w-3.5 h-3.5" />
          <span>Collaborators:</span>
          <div className="flex -space-x-2">
            {board.collaborators.slice(0, 5).map((c: any) => (
              <Link key={c.userId} href={`/profile/${c.user.username}`}>
                <div className="w-6 h-6 rounded-full border-2 border-surface-950 bg-gradient-to-br from-white to-white flex items-center justify-center text-[10px] font-bold">
                  {c.user.avatarUrl ? (
                    <img src={c.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(c.user.displayName)
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Items grid */}
      {loadingItems ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : itemsData?.items?.length > 0 ? (
        <>
          {editMode && (
            <p className="text-xs text-white mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Drag to reorder · Tap × to remove
            </p>
          )}
          <SortableBoardGrid
            items={itemsData.items}
            boardId={boardId}
            editMode={editMode}
            onRemove={(outfitId) => removeMutation.mutate(outfitId)}
          />
        </>
      ) : (
        <EmptyBoardState isOwner={isOwner} boardId={boardId} />
      )}
    </div>
  )
}

function BoardItemCard({
  item, index, editMode, onRemove,
}: {
  item: any
  index: number
  editMode: boolean
  onRemove: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="break-inside-avoid mb-3"
    >
      <Link
        href={`/outfits/${item.outfit.id}`}
        className={cn(
          "group relative block rounded-2xl overflow-hidden bg-zinc-900",
          editMode && "ring-2 ring-white/20"
        )}
      >
        <img
          src={item.outfit.thumbnailUrl ?? item.outfit.imageUrl}
          alt={item.outfit.title}
          className="w-full transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Note */}
        {item.note && (
          <div className="absolute bottom-2 left-2 right-2 glass rounded-lg px-2 py-1.5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[11px] text-white/80 line-clamp-2">{item.note}</p>
          </div>
        )}

        {/* Edit mode: remove button */}
        {editMode && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 backdrop-blur-sm flex items-center justify-center text-white transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </Link>
    </motion.div>
  )
}

function EmptyBoardState({ isOwner, boardId }: { isOwner: boolean; boardId: string }) {
  return (
    <div className="text-center py-24 space-y-3">
      <div className="text-5xl">📌</div>
      <h3 className="font-semibold text-white/50">
        {isOwner ? "Start collecting" : "This board is empty"}
      </h3>
      <p className="text-sm text-white/30">
        {isOwner
          ? "Save outfits from the feed to build your collection."
          : "Check back later or browse other boards."}
      </p>
      {isOwner && (
        <Link href="/feed" className="btn-primary text-sm px-5 py-2.5 mt-3 inline-flex">
          <Plus className="w-3.5 h-3.5" />
          Browse the feed
        </Link>
      )}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-72 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
      <div className="text-5xl">🔒</div>
      <h2 className="text-xl font-display font-bold">Board not found or private</h2>
      <Link href="/boards" className="btn-primary text-sm px-5 py-2.5 mt-3">
        Back to boards
      </Link>
    </div>
  )
}
