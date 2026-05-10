import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const diff = (Date.now() - d.getTime()) / 1000

  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function truncate(str: string, n: number): string {
  return str.length > n ? `${str.slice(0, n)}…` : str
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export const STYLE_LABELS: Record<string, string> = {
  STREETWEAR: "Streetwear",
  LUXURY: "Luxury",
  OLD_MONEY: "Old Money",
  TECHWEAR: "Techwear",
  Y2K: "Y2K",
  MINIMAL: "Minimal",
  VINTAGE: "Vintage",
  ANIME: "Anime",
  CYBERPUNK: "Cyberpunk",
  CASUAL: "Casual",
  FORMAL: "Formal",
  ATHLEISURE: "Athleisure",
  COTTAGECORE: "Cottagecore",
  DARK_ACADEMIA: "Dark Academia",
  COASTAL: "Coastal",
}

export const STYLE_EMOJIS: Record<string, string> = {
  STREETWEAR: "🏙️",
  LUXURY: "💎",
  OLD_MONEY: "🎩",
  TECHWEAR: "⚡",
  Y2K: "✨",
  MINIMAL: "◻️",
  VINTAGE: "📷",
  ANIME: "🌸",
  CYBERPUNK: "🤖",
  CASUAL: "👕",
  FORMAL: "🎭",
  ATHLEISURE: "🏃",
  COTTAGECORE: "🌿",
  DARK_ACADEMIA: "📚",
  COASTAL: "🌊",
}
