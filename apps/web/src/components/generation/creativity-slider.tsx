"use client"

import * as Slider from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface CreativitySliderProps {
  value: number
  onChange: (v: number) => void
}

export function CreativitySlider({ value, onChange }: CreativitySliderProps) {
  return (
    <Slider.Root
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={0.1}
      max={1}
      step={0.05}
      className="relative flex items-center w-full h-5 cursor-pointer"
    >
      <Slider.Track className="relative h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
        <Slider.Range
          className="absolute h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #7c3aed, #c026d3, #ec4899)" }}
        />
      </Slider.Track>
      <Slider.Thumb
        className={cn(
          "block w-4 h-4 rounded-full bg-white shadow-md border-2 border-white",
          "transition-transform focus:outline-none focus:scale-125",
          "hover:scale-110"
        )}
        aria-label="Creativity"
      />
    </Slider.Root>
  )
}
