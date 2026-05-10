"use client"

import { useState, useEffect } from "react"
import {
  DndContext, type DragEndEvent, MouseSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext, useSortable, rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import Link from "next/link"
import { Trash2, GripVertical } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { styliqRoutes } from "@/lib/api-styliq"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  outfit: { id: string; thumbnailUrl: string | null; imageUrl: string; title: string }
  note: string | null
}

export function SortableBoardGrid({
  items: initialItems,
  boardId,
  editMode,
  onRemove,
}: {
  items: Item[]
  boardId: string
  editMode: boolean
  onRemove: (outfitId: string) => void
}) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState(initialItems)

  // Sync external changes (e.g. after add/remove) into local state
  useEffect(() => setItems(initialItems), [initialItems])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) =>
      api.post(styliqRoutes.boards.reorder(boardId), { itemIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-items", boardId] })
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    reorderMutation.mutate(next.map((i) => i.id))
  }

  // Skip dnd in non-edit mode for perf — render plain grid
  if (!editMode) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="break-inside-avoid mb-3"
          >
            <Link
              href={`/outfits/${item.outfit.id}`}
              className="group relative block rounded-2xl overflow-hidden bg-zinc-900"
            >
              <img
                src={item.outfit.thumbnailUrl ?? item.outfit.imageUrl}
                alt={item.outfit.title}
                className="w-full transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {item.note && (
                <div className="absolute bottom-2 left-2 right-2 glass rounded-lg px-2 py-1.5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[11px] text-white/80 line-clamp-2">{item.note}</p>
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    )
  }

  // Edit mode → sortable grid (CSS grid for stable reorder)
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <SortableTile key={item.id} item={item} onRemove={() => onRemove(item.outfit.id)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableTile({ item, onRemove }: { item: Item; onRemove: () => void }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
      }}
      className={cn(
        "relative group aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 ring-2 transition-shadow",
        isDragging
          ? "ring-white shadow-[0_20px_60px_rgba(124,58,237,0.5)] cursor-grabbing"
          : "ring-white/20 cursor-grab"
      )}
      {...attributes}
      {...listeners}
    >
      <img
        src={item.outfit.thumbnailUrl ?? item.outfit.imageUrl}
        alt={item.outfit.title}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* Drag handle indicator */}
      <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Remove */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 backdrop-blur-sm flex items-center justify-center text-white"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
