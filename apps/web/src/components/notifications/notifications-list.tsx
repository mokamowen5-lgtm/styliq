"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Heart, MessageCircle, UserPlus, Sparkles, TrendingUp,
  Bell, ShoppingBag, CheckCheck, Trash2,
} from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import { cn, formatRelativeTime } from "@/lib/utils"

const NOTIFICATION_ICONS: Record<string, { icon: React.ElementType; gradient: string }> = {
  LIKE: { icon: Heart, gradient: "from-red-500 to-white" },
  COMMENT: { icon: MessageCircle, gradient: "from-white to-zinc-300" },
  FOLLOW: { icon: UserPlus, gradient: "from-white to-white" },
  GENERATION_DONE: { icon: Sparkles, gradient: "from-white to-white" },
  NEW_FOLLOWER: { icon: UserPlus, gradient: "from-white to-white" },
  TRENDING: { icon: TrendingUp, gradient: "from-white to-zinc-300" },
  SYSTEM: { icon: Bell, gradient: "from-slate-500 to-slate-600" },
  PURCHASE: { icon: ShoppingBag, gradient: "from-zinc-300 to-zinc-500" },
}

export function NotificationsList() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get(apiRoutes.notifications.list)).data,
    refetchInterval: 30_000,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.notifications.markAllRead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(apiRoutes.notifications.markRead(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-black">Notifications</h1>
          {data?.unreadCount > 0 && (
            <p className="text-sm text-white/40 mt-0.5">
              {data.unreadCount} unread
            </p>
          )}
        </div>
        {data?.unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="btn-ghost text-sm px-3 py-2"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <Bell className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="font-semibold text-white/50">No notifications yet</h3>
          <p className="text-sm text-white/30">
            We'll let you know when something exciting happens.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {data?.items?.map((notif: any, i: number) => {
            const config = NOTIFICATION_ICONS[notif.type] ?? NOTIFICATION_ICONS.SYSTEM
            const Icon = config.icon

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.isRead && markReadMutation.mutate(notif.id)}
                className={cn(
                  "card p-4 flex items-start gap-3 cursor-pointer transition-all hover:bg-white/[0.06] group",
                  !notif.isRead && "bg-white/[0.04] border-white/10"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                  config.gradient
                )}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        notif.isRead ? "text-white/60" : "text-white font-medium"
                      )}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{notif.body}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-white/25 flex-shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {notif.actionUrl && (
                      <Link
                        href={notif.actionUrl}
                        className="text-xs text-white hover:text-white transition-colors"
                      >
                        View →
                      </Link>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMutation.mutate(notif.id)
                      }}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-white flex-shrink-0 mt-1" />
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
