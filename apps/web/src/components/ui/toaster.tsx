"use client"

import * as Toast from "@radix-ui/react-toast"
import { useToast } from "@/hooks/use-toast"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-white" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, variant = "info" }) => (
        <Toast.Root
          key={id}
          className={cn(
            "glass rounded-2xl p-4 flex items-start gap-3 shadow-card",
            "data-[state=open]:animate-slide-in-right",
            "data-[state=closed]:animate-fade-in",
            "border",
            variant === "success" && "border-emerald-500/20",
            variant === "error" && "border-red-500/20",
            variant === "info" && "border-white/10"
          )}
          onOpenChange={(open) => !open && dismiss(id)}
        >
          <div className="mt-0.5">{ICONS[variant]}</div>
          <div className="flex-1 min-w-0">
            {title && <Toast.Title className="text-sm font-semibold text-white">{title}</Toast.Title>}
            {description && (
              <Toast.Description className="text-xs text-white/50 mt-0.5">{description}</Toast.Description>
            )}
          </div>
          <Toast.Close
            onClick={() => dismiss(id)}
            className="text-white/30 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80 outline-none" />
    </Toast.Provider>
  )
}
