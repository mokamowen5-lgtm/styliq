"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutGrid, Wand2, ShoppingBag, User,
  Settings, Bell, LogOut, Crown, Layout, Search,
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/feed", icon: LayoutGrid, label: "Feed" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/boards", icon: Layout, label: "Boards" },
  { href: "/studio", icon: Wand2, label: "Studio" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/profile", icon: User, label: "Profile" },
]

const BOTTOM_NAV = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-[72px] xl:w-64 flex-col h-screen sticky top-0 border-r border-white/[0.04] bg-black p-3 xl:p-4 flex-shrink-0">
      {/* Logo */}
      <Link href="/feed" className="flex items-center px-1 mb-8 h-10">
        <div className="hidden xl:block">
          <Logo size={26} showWordmark color="#ffffff" />
        </div>
        <div className="block xl:hidden">
          <Logo size={28} color="#ffffff" />
        </div>
      </Link>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                active
                  ? "text-white bg-white/[0.08]"
                  : "text-white/40 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white"
                />
              )}
              <item.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-white")} />
              <span className="hidden xl:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner */}
      <div className="hidden xl:block mb-4">
        <div className="gradient-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold">Go Premium</span>
          </div>
          <p className="text-xs text-white/40">Unlimited AI generations & HD quality</p>
          <Link href="/settings/billing" className="btn-primary text-xs px-4 py-2 w-full justify-center">
            Upgrade · €9/mo
          </Link>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="space-y-1 border-t border-white/[0.04] pt-3">
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/30 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden xl:block">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}
