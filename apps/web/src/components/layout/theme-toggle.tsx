"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Palette, Check } from "lucide-react"
import { useThemeStore, THEME_CONFIGS, type AestheticTheme } from "@/store/theme-store"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = THEME_CONFIGS[theme]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors relative group"
          aria-label="Change aesthetic theme"
        >
          <Palette className="w-4 h-4" />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-950 transition-colors"
            style={{ backgroundColor: current.accent }}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 glass rounded-2xl p-2 min-w-[260px] shadow-card"
          asChild
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Aesthetic
            </div>
            {(Object.entries(THEME_CONFIGS) as [AestheticTheme, typeof THEME_CONFIGS[AestheticTheme]][]).map(
              ([key, cfg]) => (
                <DropdownMenu.Item
                  key={key}
                  onSelect={() => setTheme(key)}
                  className="px-3 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/[0.05] outline-none transition-colors"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-base flex-shrink-0",
                    cfg.gradient
                  )}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{cfg.label}</p>
                    <p className="text-[10px] text-white/40 truncate">{cfg.description}</p>
                  </div>
                  {theme === key && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                </DropdownMenu.Item>
              )
            )}
            <div className="border-t border-white/[0.06] mt-2 pt-2 px-3 py-1.5">
              <p className="text-[10px] text-white/25 leading-relaxed">
                Aesthetic mode tints accents and recommendations — never restricts what you can browse.
              </p>
            </div>
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
