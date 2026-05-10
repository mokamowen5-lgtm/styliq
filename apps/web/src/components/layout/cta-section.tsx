"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, type: "spring" }}
          className="relative gradient-border rounded-4xl p-12 sm:p-16 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-mesh-gradient opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white 900/20 to-surface-950/80 pointer-events-none" />

          <div className="relative space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand mx-auto flex items-center justify-center shadow-glow animate-float">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tight">
                Start creating
                <br />
                <span className="gradient-text-brand">for free today</span>
              </h2>
              <p className="text-lg text-white/50 max-w-md mx-auto">
                5 free AI generations daily. No credit card. No commitment.
                Just plug in and go viral.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="btn-primary px-8 py-4 text-base group">
                <Sparkles className="w-4 h-4" />
                Generate Your First Outfit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="text-xs text-white/20">
              Available on Web · iOS · Android
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
