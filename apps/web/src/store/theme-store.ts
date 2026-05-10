"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AestheticTheme = "GIRL" | "BOY" | "NEUTRAL"

interface ThemeState {
  theme: AestheticTheme
  setTheme: (t: AestheticTheme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "NEUTRAL",
      setTheme: (theme) => {
        set({ theme })
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-aesthetic", theme.toLowerCase())
        }
      },
    }),
    {
      name: "styliq-theme",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-aesthetic", state.theme.toLowerCase())
        }
      },
    }
  )
)

/**
 * Theme palette config — minimal monochrome with subtle warm/cool accents.
 * The actual CSS lives in globals.css via [data-aesthetic="..."] selectors.
 * The brand stays mostly black & white in all modes — only secondary accent shifts.
 */
export const THEME_CONFIGS = {
  NEUTRAL: {
    label: "Neutral",
    emoji: "○",
    description: "Pure black & white",
    accent: "#ffffff",
    gradient: "from-white to-zinc-200",
    primaryHue: "white",
  },
  GIRL: {
    label: "Warm",
    emoji: "◐",
    description: "Subtle warm tint",
    accent: "#fbcfe8",
    gradient: "from-white to-rose-100",
    primaryHue: "rose",
  },
  BOY: {
    label: "Cool",
    emoji: "◑",
    description: "Subtle cool tint",
    accent: "#cffafe",
    gradient: "from-white to-cyan-100",
    primaryHue: "cyan",
  },
} as const
