"use client"

import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import type { StyleCategory } from "@stylesnap/types"

const STYLES = Object.keys(STYLE_LABELS) as StyleCategory[]

interface StylePickerProps {
  value: StyleCategory
  onChange: (v: StyleCategory) => void
  compact?: boolean
}

export function StylePicker({ value, onChange, compact = false }: StylePickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STYLES.map((style) => (
        <button
          key={style}
          onClick={() => onChange(style)}
          className={cn(
            "transition-all duration-200 border font-medium",
            compact
              ? "px-2 py-1 rounded-lg text-[11px]"
              : "px-2.5 py-1.5 rounded-xl text-xs",
            value === style
              ? "border-white/40 bg-white/10 text-white shadow-glow-sm"
              : "border-white/[0.06] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/70"
          )}
        >
          {STYLE_EMOJIS[style]} {STYLE_LABELS[style]}
        </button>
      ))}
    </div>
  )
}
