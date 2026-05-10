"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Sparkles, Shirt, Palette, Upload, X, Wand2, Zap, ChevronDown,
  Download, Share2, Heart, RotateCcw, Settings2, TrendingUp, Crown
} from "lucide-react"
import Image from "next/image"
import { api, apiRoutes } from "@/lib/api"
import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { StyleCategory, GenerationMode, AiGeneration } from "@stylesnap/types"
import { GenerationResult } from "./generation-result"
import { StylePicker } from "./style-picker"
import { CreativitySlider } from "./creativity-slider"

type Tab = "outfit" | "tryon" | "brand"

const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "outfit", label: "Outfit Generator", icon: Sparkles },
  { id: "tryon", label: "Virtual Try-On", icon: Shirt, badge: "Premium" },
  { id: "brand", label: "Brand Studio", icon: Palette, badge: "VIP" },
]

const OUTFIT_MODES = [
  { value: "standard", label: "Standard", emoji: "✨" },
  { value: "viral_tiktok", label: "Viral TikTok", emoji: "🔥" },
  { value: "luxury", label: "Luxury", emoji: "💎" },
  { value: "budget", label: "Budget", emoji: "💰" },
  { value: "designer", label: "Designer", emoji: "👑" },
]

export function GenerationStudio() {
  const [tab, setTab] = useState<Tab>("outfit")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StyleCategory>("STREETWEAR")
  const [creativity, setCreativity] = useState(0.7)
  const [mode, setMode] = useState("standard")
  const [generation, setGeneration] = useState<AiGeneration | null>(null)
  const [pollingId, setPollingId] = useState<string | null>(null)

  // Upload image
  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setUploadedImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload =
        tab === "outfit"
          ? {
              styleCategory: selectedStyle,
              creativity,
              mode,
              inputImageUrl: uploadedImage ?? undefined,
              generateVariants: 3,
            }
          : {}

      const endpoint =
        tab === "outfit"
          ? apiRoutes.ai.generateOutfit
          : tab === "tryon"
          ? apiRoutes.ai.generateTryOn
          : apiRoutes.ai.generateBrand

      const { data } = await api.post(endpoint, payload)
      return data as AiGeneration
    },
    onSuccess: (gen) => {
      setGeneration(gen)
      if (gen.status !== "COMPLETED") {
        setPollingId(gen.id)
      }
    },
  })

  // Poll for generation status
  const { data: polledGen } = useQuery({
    queryKey: ["generation", pollingId],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.ai.generation(pollingId!))
      return data as AiGeneration
    },
    enabled: !!pollingId,
    refetchInterval: (query) => {
      const gen = query.state.data
      if (!gen) return 2000
      if (gen.status === "COMPLETED" || gen.status === "FAILED") {
        setPollingId(null)
        setGeneration(gen)
        return false
      }
      return 2000
    },
  })

  const activeGen = polledGen ?? generation
  const isProcessing =
    generateMutation.isPending ||
    (activeGen?.status === "QUEUED") ||
    (activeGen?.status === "PROCESSING")

  function reset() {
    setGeneration(null)
    setPollingId(null)
    generateMutation.reset()
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black">
            AI <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Generate outfits, try on clothes, and build your brand with AI
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] w-fit mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                tab === t.id
                  ? "bg-gradient-brand text-white shadow-glow-sm"
                  : "text-white/40 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge && (
                <span className="badge bg-white/10 text-white/50 text-[10px] px-1.5 py-0.5">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          {/* Left — Controls panel */}
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-white/80">Your Photo</h3>
                <span className="text-xs text-white/30">Optional for outfit mode</span>
              </div>

              {uploadedImage ? (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 badge bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[10px]">
                    ✓ Photo uploaded
                  </div>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    "aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200",
                    isDragActive
                      ? "border-white/40 bg-white/[0.04]"
                      : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/60">
                      {isDragActive ? "Drop here" : "Upload selfie"}
                    </p>
                    <p className="text-xs text-white/25 mt-1">JPG, PNG, WebP · Max 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Style selector */}
            {tab === "outfit" && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-sm text-white/80">Style</h3>
                <StylePicker value={selectedStyle} onChange={setSelectedStyle} />
              </div>
            )}

            {/* Generation mode */}
            {tab === "outfit" && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-sm text-white/80">Mode</h3>
                <div className="grid grid-cols-2 gap-2">
                  {OUTFIT_MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left",
                        mode === m.value
                          ? "border-white/[0.04]0 bg-white/[0.06] text-white"
                          : "border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                      )}
                    >
                      <span className="mr-1.5">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Creativity slider */}
            {tab === "outfit" && (
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white/80">Creativity</h3>
                  <span className="text-xs font-mono text-white">
                    {Math.round(creativity * 100)}%
                  </span>
                </div>
                <CreativitySlider value={creativity} onChange={setCreativity} />
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>Conservative</span>
                  <span>Wild</span>
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={() => generateMutation.mutate()}
              disabled={isProcessing}
              className="btn-primary w-full py-4 text-base"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate{tab === "outfit" ? " Outfit" : tab === "tryon" ? " Try-On" : " Design"}
                </>
              )}
            </button>
          </div>

          {/* Right — Results */}
          <div>
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <GeneratingState key="loading" mode={tab} />
              ) : activeGen?.status === "COMPLETED" ? (
                <GenerationResult
                  key="result"
                  generation={activeGen}
                  onReset={reset}
                />
              ) : activeGen?.status === "FAILED" ? (
                <FailedState key="failed" onRetry={() => generateMutation.mutate()} />
              ) : (
                <EmptyState key="empty" tab={tab} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full min-h-[500px] glass rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-4"
    >
      <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        {tab === "outfit" ? (
          <Sparkles className="w-8 h-8 text-white/20" />
        ) : tab === "tryon" ? (
          <Shirt className="w-8 h-8 text-white/20" />
        ) : (
          <Palette className="w-8 h-8 text-white/20" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-white/50">
          {tab === "outfit"
            ? "Your outfit will appear here"
            : tab === "tryon"
            ? "Try-on preview will appear here"
            : "Your design will appear here"}
        </h3>
        <p className="text-sm text-white/25 mt-1">
          Configure your settings and hit Generate
        </p>
      </div>
    </motion.div>
  )
}

function GeneratingState({ mode }: { mode: Tab }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full min-h-[500px] glass rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-6"
    >
      {/* Animated orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-gradient-brand animate-ping opacity-20" />
        <div className="absolute inset-2 rounded-full bg-gradient-brand animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-black flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-white">AI is working…</h3>
        <p className="text-sm text-white/40">
          {mode === "outfit"
            ? "Analyzing style trends and generating your look"
            : mode === "tryon"
            ? "Fitting garment to your body"
            : "Designing your brand assets"}
        </p>
      </div>

      {/* Progress steps */}
      <div className="space-y-2 w-full max-w-xs">
        {["Analyzing input", "Generating outfit", "Optimizing quality"].map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.5 }}
            className="flex items-center gap-3 text-xs text-white/40"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
            {step}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function FailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full min-h-[500px] glass rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-4"
    >
      <div className="text-4xl">❌</div>
      <h3 className="font-semibold text-white/70">Generation failed</h3>
      <p className="text-sm text-white/35">Something went wrong. Please try again.</p>
      <button onClick={onRetry} className="btn-primary px-6 py-2.5 text-sm">
        <RotateCcw className="w-4 h-4" />
        Retry
      </button>
    </motion.div>
  )
}
