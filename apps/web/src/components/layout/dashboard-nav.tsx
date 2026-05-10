"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export function DashboardNav() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="h-14 border-b border-white/[0.04] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 bg-black/80 backdrop-blur-xl sticky top-0 z-30">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && router.push(`/search?q=${encodeURIComponent(searchQuery)}`)}
          placeholder="Search styles, creators, hashtags…"
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
        />
      </form>

      <div className="flex items-center gap-1 ml-4">
        <ThemeToggle />

        <Link
          href="/notifications"
          className="relative w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />
        </Link>

        <Link href="/studio" className="btn-primary text-xs px-4 py-2 hidden sm:flex ml-1">
          <Sparkles className="w-3 h-3" />
          Generate
        </Link>
      </div>
    </header>
  )
}
