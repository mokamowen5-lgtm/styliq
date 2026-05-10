import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
        display: ["var(--font-cal-sans)", ...fontFamily.sans],
      },
      colors: {
        // Pure monochrome brand — black & white only
        brand: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        surface: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          800: "#1c1c1f",
          900: "#0e0e10",
          950: "#000000",
        },
        // Subtle semantic accents (kept for status states only)
        accent: {
          neutral: "#ffffff",
          subtle: "#a1a1aa",
          success: "#10b981",
          danger: "#ef4444",
          warning: "#f59e0b",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Now: pure white-to-grey gradient instead of violet/pink
        "gradient-brand":
          "linear-gradient(135deg, #ffffff 0%, #d4d4d8 100%)",
        "gradient-brand-dark":
          "linear-gradient(135deg, #18181b 0%, #000000 100%)",
        "gradient-dark":
          "linear-gradient(135deg, #000000 0%, #0e0e10 50%, #000000 100%)",
        "mesh-gradient":
          "radial-gradient(at 40% 20%, hsla(0,0%,100%,0.06) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(0,0%,100%,0.04) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(0,0%,100%,0.05) 0px, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "slide-in-bottom": "slideInBottom 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
        glow: "glow 3s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideInRight: { "0%": { opacity: "0", transform: "translateX(40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        slideInBottom: { "0%": { opacity: "0", transform: "translateY(40px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(255,255,255,0.08)" },
          "100%": { boxShadow: "0 0 60px rgba(255,255,255,0.18), 0 0 100px rgba(255,255,255,0.08)" },
        },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-20px)" } },
        bounceSubtle: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        gradientShift: { "0%, 100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
      },
      boxShadow: {
        // Monochrome glow (subtle white halo on black)
        glow: "0 0 30px rgba(255,255,255,0.12)",
        "glow-sm": "0 0 15px rgba(255,255,255,0.08)",
        "glow-lg": "0 0 60px rgba(255,255,255,0.18)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        card: "0 4px 24px rgba(0,0,0,0.5)",
        "card-hover": "0 12px 48px rgba(0,0,0,0.7)",
        premium: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      screens: {
        xs: "375px",
        "3xl": "1920px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}

export default config
