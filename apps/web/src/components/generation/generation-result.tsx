"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Heart, Download, Share2, RotateCcw, ShoppingBag,
  TrendingUp, Sparkles, ExternalLink, Save, Check
} from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { AiGeneration } from "@stylesnap/types"

interface GenerationResultProps {
  generation: AiGeneration
  onReset: () => void
}

export function GenerationResult({ generation, onReset }: GenerationResultProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.post(apiRoutes.outfits.create, {
        generationId: generation.id,
        imageUrl: generation.outputImages[selectedIdx],
        title: `AI Outfit — ${generation.styleCategory ?? "Custom"}`,
        styles: generation.styleCategory ? [generation.styleCategory] : [],
        isPublic: true,
      })
    },
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ["outfits"] })
    },
  })

  async function handleDownload() {
    const url = generation.outputImages[selectedIdx]
    const a = document.createElement("a")
    a.href = url
    a.download = `stylesnap-outfit-${Date.now()}.jpg`
    a.click()
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "My AI Outfit from STYLIQ",
        url: window.location.href,
      })
    }
  }

  const viralityScore = (generation.metadata as any)?.viralityScore as number | undefined

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="h-full space-y-4"
    >
      {/* Main image */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="relative aspect-[3/4] max-h-[560px] bg-zinc-900">
          {generation.outputImages[selectedIdx] && (
            <img
              src={generation.outputImages[selectedIdx]}
              alt="Generated outfit"
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {viralityScore && (
              <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  {Math.round(viralityScore * 100)}% Viral
                </span>
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4">
            <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">AI Generated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variant thumbnails */}
      {generation.outputImages.length > 1 && (
        <div className="flex gap-2">
          {generation.outputImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                i === selectedIdx ? "border-white shadow-glow-sm" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt={`Variant ${i + 1}`} className="w-full h-full object-cover" />
              {i === selectedIdx && (
                <div className="absolute inset-0 bg-white/[0.06]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || saved}
          className={cn(
            "btn-primary py-3 text-sm",
            saved && "bg-emerald-600 hover:bg-emerald-600"
          )}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved to Feed
            </>
          ) : saveMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save to Feed
            </>
          )}
        </button>

        <button onClick={handleDownload} className="btn-outline py-3 text-sm">
          <Download className="w-4 h-4" />
          Download HD
        </button>

        <button onClick={handleShare} className="btn-ghost py-3 text-sm">
          <Share2 className="w-4 h-4" />
          Share
        </button>

        <button onClick={onReset} className="btn-ghost py-3 text-sm">
          <RotateCcw className="w-4 h-4" />
          Regenerate
        </button>
      </div>

      {/* Shop the look CTA */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Shop this look</p>
            <p className="text-xs text-white/40">Find exact items or similar pieces</p>
          </div>
        </div>
        <button className="badge-brand text-xs px-3 py-1.5 flex items-center gap-1.5">
          Browse <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  )
}
