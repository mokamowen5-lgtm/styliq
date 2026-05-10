"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, ArrowRight, Play, Zap, Star, TrendingUp } from "lucide-react"

const DEMO_OUTFITS = [
  { style: "Streetwear", src: "/demo/outfit-1.jpg", rotate: "-6deg", zIndex: 1 },
  { style: "Luxury", src: "/demo/outfit-2.jpg", rotate: "0deg", zIndex: 3 },
  { style: "Old Money", src: "/demo/outfit-3.jpg", rotate: "6deg", zIndex: 2 },
]

const STATS = [
  { label: "Outfits Generated", value: "2.4M+", icon: Sparkles },
  { label: "Active Users", value: "180K+", icon: Star },
  { label: "Style Categories", value: "15", icon: TrendingUp },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
}

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            {/* Badge */}
            <motion.div variants={item} className="inline-flex">
              <span className="badge-brand text-xs px-3 py-1.5 rounded-full font-medium">
                <Zap className="w-3 h-3 fill-current" />
                AI-Powered Fashion · 2026
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={item} className="space-y-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[0.95]">
                Your Style,
                <br />
                <span className="gradient-text-brand">Reimagined</span>
                <br />
                by AI
              </h1>
              <p className="text-lg sm:text-xl text-white/50 max-w-lg leading-relaxed">
                Upload a photo. Choose a vibe. Watch AI generate hyper-realistic outfits
                tailored to your body, style, and the moment.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary px-7 py-4 text-base group">
                <Sparkles className="w-4 h-4" />
                Generate Your Outfit Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn-ghost px-6 py-4 text-base flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </div>
                Watch demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={item} className="flex items-center gap-4 pt-2">
              {/* Avatar stack */}
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-surface-950 bg-gradient-to-br from-white to-white flex items-center justify-center text-[10px] font-bold"
                    style={{ zIndex: 5 - i }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-white text-white" />
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  Loved by <span className="text-white/70 font-semibold">180,000+</span> fashion enthusiasts
                </p>
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={item} className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-white" />
                    <span className="text-xl font-bold gradient-text">{value}</span>
                  </div>
                  <p className="text-xs text-white/40">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Outfit cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 80 }}
            className="relative h-[560px] hidden lg:block"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-radial from-white 600/20 to-transparent rounded-3xl" />

            {/* Outfit cards */}
            {DEMO_OUTFITS.map((outfit, i) => (
              <motion.div
                key={outfit.style}
                initial={{ opacity: 0, y: 40, rotate: outfit.rotate }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotate: outfit.rotate,
                  transition: { delay: 0.4 + i * 0.15, type: "spring", stiffness: 80 },
                }}
                whileHover={{ scale: 1.03, zIndex: 10, transition: { duration: 0.2 } }}
                className="absolute cursor-pointer"
                style={{
                  left: `${10 + i * 22}%`,
                  top: `${5 + (i % 2) * 8}%`,
                  zIndex: outfit.zIndex,
                  transform: `rotate(${outfit.rotate})`,
                }}
              >
                <div className="w-48 h-64 rounded-2xl overflow-hidden shadow-card border border-white/10 bg-zinc-900">
                  <div className="w-full h-full bg-gradient-to-br from-white 900/40 to-pink-900/40 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white/60">{outfit.style}</span>
                  </div>
                </div>
                {/* Style label */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium text-white/80 whitespace-nowrap shadow-lg">
                  {outfit.style}
                </div>
              </motion.div>
            ))}

            {/* Floating AI badge */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-12 left-4 glass rounded-2xl p-3 flex items-center gap-3 shadow-premium"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">AI Generated</p>
                <p className="text-[10px] text-white/40">Outfit ready in 4s</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </motion.div>

            {/* Virality score badge */}
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-8 right-0 glass rounded-2xl p-3 shadow-premium"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-white/40">Virality Score</p>
                  <p className="text-sm font-bold text-emerald-400">94%</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  )
}
