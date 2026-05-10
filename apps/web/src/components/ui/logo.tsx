import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  /** Show "STYLIQ" wordmark next to the S mark. */
  showWordmark?: boolean
  /** Square mark size in px. The wordmark scales accordingly. */
  size?: number
  /** Logo color — defaults to currentColor. */
  color?: string
}

/**
 * STYLIQ brand logo.
 * Stylized angular "S" with a small leg detail at the bottom-left.
 * Designed in pure SVG so it scales crisply at any size and inherits color.
 */
export function Logo({
  className,
  showWordmark = false,
  size = 32,
  color = "currentColor",
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <SLetter size={size} color={color} />
      {showWordmark && (
        <span
          className="font-display font-black tracking-tight leading-none"
          style={{ fontSize: size * 0.6, color, letterSpacing: "0.02em" }}
        >
          STYLIQ
        </span>
      )}
    </div>
  )
}

function SLetter({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="STYLIQ"
    >
      {/* Top diagonal slab */}
      <path
        d="M88 12 H38 C26 12, 16 22, 16 34 V40 C16 48, 22 52, 30 52 H64 L78 38"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Bottom diagonal slab */}
      <path
        d="M22 88 H66 C78 88, 88 78, 88 66 V60 C88 52, 82 48, 74 48 H40 L26 62"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Decorative leg / flag at bottom-left */}
      <path
        d="M16 88 H32"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="square"
      />
    </svg>
  )
}
