"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera, Upload, X, ArrowLeft, Sparkles, Loader2, ImageIcon,
} from "lucide-react"
import { api } from "@/lib/api"
import { styliqRoutes } from "@/lib/api-styliq"
import { OutfitCard } from "@/components/feed/outfit-card"
import { cn } from "@/lib/utils"

export function VisualSearch() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [results, setResults] = useState<any[] | null>(null)

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreviewUrl(dataUrl)
      mutation.mutate(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const mutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { data } = await api.post(styliqRoutes.search.visual, { imageUrl, limit: 24 })
      return data as any[]
    },
    onSuccess: (data) => setResults(data),
  })

  function reset() {
    setPreviewUrl(null)
    setResults(null)
    mutation.reset()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-8"
      >
        <div className="inline-flex items-center gap-2 badge-brand text-xs">
          <Camera className="w-3 h-3" />
          Powered by GPT-4 Vision
        </div>
        <h1 className="text-3xl font-display font-black">
          Find <span className="gradient-text">visually similar</span> outfits
        </h1>
        <p className="text-white/40 text-sm">
          Upload any outfit photo. Our AI describes the look, then finds the closest matches in the feed.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-3xl overflow-hidden bg-zinc-900 aspect-[3/4]">
                <img src={previewUrl} alt="Search source" className="w-full h-full object-cover" />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {mutation.isPending && (
                <div className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Analyzing image…</p>
                    <p className="text-xs text-white/40">GPT-4 Vision describes the outfit, then we vector-search</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200",
                isDragActive
                  ? "border-white/60 bg-white/[0.06] scale-[1.02]"
                  : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                <Upload className="w-7 h-7 text-white/30" />
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-semibold text-white/70 mb-1">
                  {isDragActive ? "Drop the image" : "Drop or click to upload"}
                </p>
                <p className="text-xs text-white/30">
                  JPG, PNG, WebP · Max 10 MB
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-white/25">
                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                Try a TikTok screenshot, magazine pic, or your own outfit
              </div>
            </div>
          )}
        </motion.div>

        {/* Results */}
        <div>
          <AnimatePresence mode="wait">
            {!previewUrl ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
              >
                <ImageIcon className="w-12 h-12 text-white/15 mb-3" />
                <p className="text-white/40 text-sm">Your visual search results will appear here</p>
              </motion.div>
            ) : mutation.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="columns-2 sm:columns-3 gap-3 space-y-3"
              >
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
                ))}
              </motion.div>
            ) : mutation.isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-8 text-center"
              >
                <p className="text-red-400 mb-2">Something went wrong</p>
                <p className="text-xs text-white/40">
                  Visual search needs OPENAI_API_KEY configured. The fallback returns trending outfits.
                </p>
              </motion.div>
            ) : results?.length === 0 ? (
              <motion.div
                key="empty-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-8 text-center"
              >
                <p className="text-white/40">No similar outfits found.</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-widest text-white/40">
                  <Sparkles className="w-3 h-3" />
                  {results?.length} similar outfits found
                </div>
                <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                  {results?.map((outfit) => (
                    <OutfitCard key={outfit.id} outfit={outfit} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
