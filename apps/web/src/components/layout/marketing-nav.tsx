"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Styles", href: "#styles" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog" },
]

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"])
  const navBlur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(20px)"])
  const navBorder = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]
  )

  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-50 transition-all"
      style={{
        backgroundColor: navBg,
        backdropFilter: navBlur,
        borderBottomColor: navBorder,
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Logo size={28} showWordmark color="#ffffff" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2.5">
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-t border-white/[0.06] bg-black/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-1"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 text-sm text-white/60 hover:text-white rounded-xl hover:bg-white/[0.05] transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
            <Link href="/login" className="btn-outline text-sm w-full">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm w-full">
              Get Started Free
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
