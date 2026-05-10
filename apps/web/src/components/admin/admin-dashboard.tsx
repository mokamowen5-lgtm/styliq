"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Users, Sparkles, DollarSign, TrendingUp, Shield,
  Activity, AlertTriangle, Crown, Eye
} from "lucide-react"
import { api } from "@/lib/api"
import { formatNumber, formatPrice, formatRelativeTime } from "@/lib/utils"

const STAT_CARDS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    gradient: "from-white to-zinc-300",
    format: (v: number) => formatNumber(v),
  },
  {
    key: "totalGenerations",
    label: "AI Generations",
    icon: Sparkles,
    gradient: "from-white to-white",
    format: (v: number) => formatNumber(v),
  },
  {
    key: "mrr",
    label: "MRR",
    icon: DollarSign,
    gradient: "from-white to-zinc-300",
    format: (v: number) => formatPrice(v),
  },
  {
    key: "premiumUsers",
    label: "Premium Users",
    icon: Crown,
    gradient: "from-white to-orange-500",
    format: (v: number) => formatNumber(v),
  },
]

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/admin/stats")
      return data
    },
    refetchInterval: 30_000,
  })

  const { data: recentUsers } = useQuery({
    queryKey: ["admin", "recent-users"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/admin/users?limit=10&sort=createdAt:desc")
      return data
    },
  })

  const { data: reports } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/admin/reports?resolved=false&limit=5")
      return data
    },
  })

  return (
    <div className="min-h-screen bg-black p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">STYLIQ control center</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/40">Live data</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats ? card.format(stats[card.key] ?? 0) : "—"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Recent users */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-white" />
              Recent Users
            </h3>
            <button className="text-xs text-white/30 hover:text-white transition-colors">
              View all →
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentUsers?.items?.map((user: any) => (
              <div key={user.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user.displayName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                  <p className="text-xs text-white/30 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-[10px] ${
                    user.subscription?.tier === "VIP"
                      ? "bg-white/10 text-white border-white/10"
                      : user.subscription?.tier === "PREMIUM"
                      ? "bg-white/10 text-white border-white/10"
                      : "bg-white/[0.05] text-white/30 border-white/[0.08]"
                  }`}>
                    {user.subscription?.tier ?? "FREE"}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </div>
              </div>
            )) ?? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-2.5 w-24 rounded" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reports & flags */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-white" />
              Pending Reports
            </h3>
            {reports?.items?.length > 0 && (
              <span className="badge bg-red-500/20 text-red-400 border-red-500/20 text-[10px]">
                {reports.items.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-white/[0.04]">
            {reports?.items?.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                <p className="text-sm text-white/30">All clear! No pending reports.</p>
              </div>
            ) : (
              reports?.items?.map((report: any) => (
                <div key={report.id} className="px-5 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="badge bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                      {report.reason}
                    </span>
                    <span className="text-[10px] text-white/20">
                      {formatRelativeTime(report.createdAt)}
                    </span>
                  </div>
                  {report.details && (
                    <p className="text-xs text-white/40 line-clamp-2">{report.details}</p>
                  )}
                  <div className="flex gap-2">
                    <button className="text-[10px] text-emerald-400 hover:text-emerald-300">
                      Resolve
                    </button>
                    <button className="text-[10px] text-red-400 hover:text-red-300">
                      Remove
                    </button>
                  </div>
                </div>
              )) ?? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="px-5 py-3 space-y-2">
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-2.5 w-full rounded" />
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Generation activity chart placeholder */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-white" />
            AI Generation Activity (7 days)
          </h3>
          <span className="badge-brand text-xs">Live</span>
        </div>
        {/* Mini bar chart */}
        <div className="flex items-end gap-2 h-24">
          {[65, 80, 55, 90, 75, 95, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-white/40 to-white/10 transition-all duration-500"
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-white/20">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
