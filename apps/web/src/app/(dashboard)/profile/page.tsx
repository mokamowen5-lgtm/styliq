"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"

export default function CurrentUserProfile() {
  const router = useRouter()

  const { data: me, isError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get(apiRoutes.users.me)
      return data
    },
  })

  useEffect(() => {
    if (me) router.replace(`/profile/${me.username}`)
    if (isError) router.replace("/login")
  }, [me, isError, router])

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-white/30" />
    </div>
  )
}
