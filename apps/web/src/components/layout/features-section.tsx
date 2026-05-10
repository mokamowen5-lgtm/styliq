"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Sparkles, Shirt, Palette, ShoppingBag, Share2, TrendingUp,
  Wand2, Camera, Zap, Crown
} from "lucide-react"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Outfit Generation",
    description: "Upload your photo and watch AI create photorealistic outfits preserving your face and body proportions.",
    gradient: "from-white to-white",
    tag: "Core Feature",
  },
  {
    icon: Shirt,
    title: "Virtual Try-On",
    description: "Try any garment on your photo with realistic fabric simulation. 360° view with dynamic lighting.",
    gradient: "from-white to-white",
    tag: "Premium",
  },
  {
    icon: Palette,
    title: "Brand Design Studio",
    description: "Generate hoodie designs, logos, sneaker concepts and full collections with a single prompt.",
    gradient: "from-white to-rose-500",
    tag: "VIP",
  },
  {
    icon: TrendingUp,
    title: "Trend Intelligence",
    description: "Real-time trend analysis from TikTok, Instagram & Pinterest to keep your style ahead of the curve.",
    gradient: "from-white to-zinc-300",
    tag: "Live",
  },
  {
    icon: ShoppingBag,
    title: "Shop the Look",
    description: "Every generated outfit is shoppable. Buy exact items or AI-curated alternatives across 500+ brands.",
    gradient: "from-zinc-300 to-zinc-500",
    tag: "Ecommerce",
  },
  {
    icon: Share2,
    title: "TikTok-Ready Export",
    description: "Auto-generate video montages and Reels-format content to go viral with your AI outfits.",
    gradient: "from-white to-zinc-300",
    tag: "Social",
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const card = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
}

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" ref={ref} className="relative py-32 overflow-hidden">
      {/* Section ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-4"
        >
          <span className="badge-brand text-xs">
            <Wand2 className="w-3 h-3" />
            Everything you need
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tight">
            Fashion at the speed of
            <span className="gradient-text"> thought</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            From outfit generation to brand building — a complete AI fashion OS in your browser.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              variants={card}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group card-hover p-6 space-y-4 relative overflow-hidden"
            >
              {/* Gradient orb on hover */}
              <div
                className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${feat.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500`}
              />

              <div className="flex items-start justify-between">
                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-glow-sm`}
                >
                  <feat.icon className="w-5 h-5 text-white" />
                </div>
                {/* Tag */}
                <span className="badge bg-white/[0.06] text-white/40 text-[10px] border border-white/[0.08]">
                  {feat.tag}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white text-lg leading-tight">{feat.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feat.description}</p>
              </div>

              {/* Bottom arrow on hover */}
              <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className={`bg-gradient-to-r ${feat.gradient} bg-clip-text text-transparent`}>
                  Learn more
                </span>
                <span className={`bg-gradient-to-r ${feat.gradient} bg-clip-text text-transparent`}>→</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
