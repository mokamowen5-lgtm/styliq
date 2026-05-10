"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Check, Sparkles, Zap, Crown } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@stylesnap/types"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

const PLAN_ICONS = { FREE: Sparkles, PREMIUM: Zap, VIP: Crown }
const PLAN_GRADIENTS = {
  FREE: "from-slate-500 to-slate-600",
  PREMIUM: "from-white to-white",
  VIP: "from-white to-orange-500",
}

export function PricingSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="pricing" ref={ref} className="relative py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tight">
            Transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            Start free. Upgrade when you're ready to go full creative.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {SUBSCRIPTION_PLANS.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.tier]
            const gradient = PLAN_GRADIENTS[plan.tier]
            const isPopular = plan.isPopular

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative rounded-3xl p-7 flex flex-col",
                  isPopular
                    ? "gradient-border bg-black shadow-premium"
                    : "glass"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="btn-primary text-[11px] px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="space-y-4 mb-8">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      gradient
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-4xl font-black text-white">
                        {plan.price === 0
                          ? "Free"
                          : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-white/30 text-sm">/ month</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                          gradient
                        )}
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-white/60 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.price === 0 ? "/register" : `/register?plan=${plan.id}`}
                  className={cn(
                    "w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                    isPopular
                      ? "btn-primary"
                      : "btn-outline"
                  )}
                >
                  {plan.price === 0 ? "Get Started Free" : `Start ${plan.name}`}
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-white/25 mt-8"
        >
          All plans include a 7-day free trial. Cancel anytime. No questions asked.
        </motion.p>
      </div>
    </section>
  )
}
