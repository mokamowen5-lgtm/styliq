"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { StyleCategory, Gender, ClothingSize } from "@stylesnap/types"

const STEPS = [
  { id: "welcome", title: "Welcome to STYLIQ" },
  { id: "gender", title: "Your gender" },
  { id: "size", title: "Your size" },
  { id: "styles", title: "Your aesthetic" },
  { id: "budget", title: "Your budget" },
  { id: "done", title: "You're all set!" },
]

const GENDERS: { value: Gender; label: string; emoji: string }[] = [
  { value: "MALE", label: "Male", emoji: "👔" },
  { value: "FEMALE", label: "Female", emoji: "👗" },
  { value: "NON_BINARY", label: "Non-binary", emoji: "✨" },
  { value: "PREFER_NOT", label: "Prefer not to say", emoji: "🌟" },
]

const CLOTHING_SIZES: ClothingSize[] = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
const STYLE_LIST = Object.keys(STYLE_LABELS) as StyleCategory[]
const BUDGETS = [
  { value: "budget", label: "Budget", desc: "Under €50/item", emoji: "💵" },
  { value: "midrange", label: "Mid-range", desc: "€50–200/item", emoji: "💳" },
  { value: "premium", label: "Premium", desc: "€200–500/item", emoji: "💎" },
  { value: "luxury", label: "Luxury", desc: "No limit", emoji: "👑" },
]

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
}

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)

  const [data, setData] = useState({
    gender: null as Gender | null,
    clothingSize: null as ClothingSize | null,
    favoriteStyles: [] as StyleCategory[],
    budgetRange: null as string | null,
  })

  function go(delta: number) {
    setDir(delta)
    setStep((s) => s + delta)
  }

  function toggleStyle(style: StyleCategory) {
    setData((d) => ({
      ...d,
      favoriteStyles: d.favoriteStyles.includes(style)
        ? d.favoriteStyles.filter((s) => s !== style)
        : [...d.favoriteStyles, style],
    }))
  }

  async function finish() {
    setSaving(true)
    try {
      await api.patch(apiRoutes.users.updateOnboarding, {
        ...data,
        onboardingCompleted: true,
      })
      router.push("/feed")
    } catch {
      router.push("/feed")
    }
  }

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white/60">STYLIQ</span>
          </div>
          <span className="text-xs text-white/30">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-brand rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="glass rounded-3xl p-8 min-h-[440px] flex flex-col">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col flex-1"
          >
            {step === 0 && <StepWelcome />}
            {step === 1 && (
              <StepGender
                value={data.gender}
                onChange={(v) => setData((d) => ({ ...d, gender: v }))}
              />
            )}
            {step === 2 && (
              <StepSize
                value={data.clothingSize}
                onChange={(v) => setData((d) => ({ ...d, clothingSize: v }))}
              />
            )}
            {step === 3 && (
              <StepStyles
                value={data.favoriteStyles}
                onToggle={toggleStyle}
              />
            )}
            {step === 4 && (
              <StepBudget
                value={data.budgetRange}
                onChange={(v) => setData((d) => ({ ...d, budgetRange: v }))}
              />
            )}
            {step === 5 && <StepDone data={data} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
          <button
            onClick={() => go(-1)}
            disabled={step === 0}
            className={cn(
              "btn-ghost text-sm px-4 py-2",
              step === 0 && "opacity-0 pointer-events-none"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => go(1)}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {saving ? "Saving…" : "Start Generating"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow"
      >
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>
      <h2 className="text-2xl font-display font-bold">Let's personalise your AI</h2>
      <p className="text-white/40 text-sm max-w-xs leading-relaxed">
        Answer 4 quick questions so our AI can generate outfits perfectly tailored to your style.
      </p>
      <div className="flex items-center gap-2 text-xs text-white/25">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Takes about 60 seconds
      </div>
    </div>
  )
}

function StepGender({ value, onChange }: { value: Gender | null; onChange: (v: Gender) => void }) {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">How do you identify?</h2>
        <p className="text-sm text-white/40 mt-1">This helps us style outfits for your body.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GENDERS.map((g) => (
          <button
            key={g.value}
            onClick={() => onChange(g.value)}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all duration-200",
              value === g.value
                ? "border-white/40 bg-white/[0.06]"
                : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
            )}
          >
            <span className="text-2xl block mb-2">{g.emoji}</span>
            <span className="text-sm font-medium text-white">{g.label}</span>
            {value === g.value && (
              <div className="mt-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepSize({ value, onChange }: { value: ClothingSize | null; onChange: (v: ClothingSize) => void }) {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">What's your clothing size?</h2>
        <p className="text-sm text-white/40 mt-1">For accurate virtual try-on fitting.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {CLOTHING_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              "w-14 h-14 rounded-xl text-sm font-bold transition-all duration-200 border",
              value === size
                ? "border-white/40 bg-white/10 text-white shadow-glow-sm"
                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white"
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepStyles({
  value,
  onToggle,
}: {
  value: StyleCategory[]
  onToggle: (s: StyleCategory) => void
}) {
  return (
    <div className="flex-1 space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold">Pick your aesthetics</h2>
        <p className="text-sm text-white/40 mt-1">Choose up to 5 styles. You can change these later.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STYLE_LIST.map((style) => {
          const selected = value.includes(style)
          const atLimit = value.length >= 5 && !selected
          return (
            <button
              key={style}
              onClick={() => !atLimit && onToggle(style)}
              disabled={atLimit}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                selected
                  ? "border-white/40 bg-white/10 text-white"
                  : atLimit
                  ? "border-white/[0.04] bg-white/[0.02] text-white/20 cursor-not-allowed"
                  : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              {STYLE_EMOJIS[style]} {STYLE_LABELS[style]}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-white/30">{value.length}/5 selected</p>
    </div>
  )
}

function StepBudget({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">Your fashion budget?</h2>
        <p className="text-sm text-white/40 mt-1">For personalised product recommendations.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {BUDGETS.map((b) => (
          <button
            key={b.value}
            onClick={() => onChange(b.value)}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all duration-200",
              value === b.value
                ? "border-white/40 bg-white/[0.06]"
                : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
            )}
          >
            <span className="text-2xl block mb-2">{b.emoji}</span>
            <span className="text-sm font-bold text-white block">{b.label}</span>
            <span className="text-xs text-white/40">{b.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepDone({ data }: { data: any }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
      >
        <Check className="w-10 h-10 text-emerald-400" />
      </motion.div>
      <h2 className="text-2xl font-display font-bold">Your style profile is ready!</h2>
      <p className="text-white/40 text-sm max-w-xs">
        Our AI has been calibrated to your aesthetic. Time to generate your first outfit.
      </p>
      <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-sm text-white/60">
          {data.favoriteStyles.slice(0, 3).map((s: StyleCategory) => STYLE_LABELS[s]).join(" · ")}
        </span>
      </div>
    </div>
  )
}
