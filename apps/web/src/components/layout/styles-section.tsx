"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { StyleCategory } from "@stylesnap/types"

const STYLES = Object.keys(STYLE_LABELS) as StyleCategory[]

const STYLE_COLORS: Partial<Record<StyleCategory, string>> = {
  STREETWEAR: "from-orange-500/20 to-amber-500/20 border-orange-500/20",
  LUXURY: "from-white/20 to-yellow-400/20 border-amber-400/20",
  OLD_MONEY: "from-emerald-600/20 to-teal-600/20 border-emerald-500/20",
  TECHWEAR: "from-white/20 to-zinc-300/20 border-white/20",
  Y2K: "from-white/20 to-rose-400/20 border-white/20",
  MINIMAL: "from-slate-400/20 to-slate-500/20 border-slate-400/20",
  VINTAGE: "from-amber-700/20 to-orange-700/20 border-amber-600/20",
  ANIME: "from-white/20 to-purple-400/20 border-white/20",
  CYBERPUNK: "from-white/10 to-white/10 border-white/10",
}

export function StylesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const [active, setActive] = useState<StyleCategory>("STREETWEAR")

  return (
    <section id="styles" ref={ref} className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-black">
            15 iconic <span className="gradient-text">styles</span>
          </h2>
          <p className="text-white/40 max-w-md mx-auto">
            From viral streetwear to quiet luxury — pick your aesthetic and let AI do the rest.
          </p>
        </motion.div>

        {/* Style grid pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setActive(style)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                active === style
                  ? "bg-gradient-brand text-white border-transparent shadow-glow-sm"
                  : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:bg-white/[0.07] hover:text-white hover:border-white/[0.15]"
              )}
            >
              {STYLE_EMOJIS[style]} {STYLE_LABELS[style]}
            </button>
          ))}
        </motion.div>

        {/* Active style preview */}
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "glass rounded-3xl p-8 bg-gradient-to-br border",
            STYLE_COLORS[active] ?? "from-white/[0.06] to-white/[0.06] border-white/10"
          )}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-5xl">{STYLE_EMOJIS[active]}</span>
              <h3 className="text-3xl font-display font-black">{STYLE_LABELS[active]}</h3>
              <p className="text-white/50 leading-relaxed">
                Explore the <strong className="text-white/80">{STYLE_LABELS[active]}</strong> aesthetic
                with AI-generated looks that blend current trends with timeless style elements.
                Upload your photo to get started.
              </p>
              <button className="btn-primary px-6 py-3">
                Generate {STYLE_LABELS[active]} Look →
              </button>
            </div>
            {/* Placeholder outfit grid */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-[3/4] rounded-xl skeleton",
                    i === 1 && "col-span-1 row-span-2"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
