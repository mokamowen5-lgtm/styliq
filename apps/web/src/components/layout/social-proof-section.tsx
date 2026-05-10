"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Star, Quote } from "lucide-react"
import { getInitials } from "@/lib/utils"

const TESTIMONIALS = [
  {
    name: "Sofia Laurent",
    handle: "@sofiastyle",
    avatar: "SL",
    gradient: "from-white to-white",
    rating: 5,
    text: "STYLIQ changed how I get dressed. I generated 3 months of outfits in an afternoon. The AI actually understands my body type.",
    followers: "284K TikTok",
  },
  {
    name: "James Park",
    handle: "@jparkfashion",
    avatar: "JP",
    gradient: "from-white to-zinc-300",
    rating: 5,
    text: "Built my entire streetwear brand identity using the brand studio. Logo, merch mockups, capsule collection — all AI, all fire.",
    followers: "156K Instagram",
  },
  {
    name: "Amara Diallo",
    handle: "@amaravibes",
    avatar: "AD",
    gradient: "from-zinc-300 to-zinc-500",
    rating: 5,
    text: "The virtual try-on is insane. I tried 47 dresses before buying online. Zero returns. Saved me €300 this season alone.",
    followers: "92K YouTube",
  },
  {
    name: "Leo Chen",
    handle: "@leotechwear",
    avatar: "LC",
    gradient: "from-white to-zinc-300",
    rating: 5,
    text: "Trend intelligence spotted TECHWEAR was about to blow up 3 weeks before TikTok caught on. That's an unfair advantage.",
    followers: "210K TikTok",
  },
  {
    name: "Marie Dubois",
    handle: "@marieoldmoney",
    avatar: "MD",
    gradient: "from-zinc-200 to-zinc-500",
    rating: 5,
    text: "Premium tier is worth every cent. Unlimited HD generations, no watermarks. My lookbook content game is untouchable.",
    followers: "67K Instagram",
  },
  {
    name: "Kai Nakamura",
    handle: "@kaianime",
    avatar: "KN",
    gradient: "from-zinc-200 to-zinc-500",
    rating: 5,
    text: "Finally an app that gets Harajuku and anime-adjacent styles right. Not just lazy streetwear with a filter. This is deep.",
    followers: "445K TikTok",
  },
]

export function SocialProofSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16 space-y-3"
        >
          <div className="flex justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-white text-white" />
            ))}
          </div>
          <h2 className="text-4xl sm:text-5xl font-display font-black">
            180,000 creators <span className="gradient-text">love it</span>
          </h2>
          <p className="text-white/40">Rated 4.9/5 across App Store, Play Store & Product Hunt</p>
        </motion.div>

        {/* Masonry-ish testimonials */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.handle}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="card-hover p-5 break-inside-avoid space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/30">{t.handle}</p>
                  </div>
                </div>
                <Quote className="w-4 h-4 text-white/10 flex-shrink-0" />
              </div>

              <p className="text-sm text-white/60 leading-relaxed">"{t.text}"</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(t.rating)].map((_, k) => (
                    <Star key={k} className="w-3 h-3 fill-white text-white" />
                  ))}
                </div>
                <span className="text-[10px] text-white/20">{t.followers}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
