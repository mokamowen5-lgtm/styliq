import { useState, useCallback } from "react"
import { nanoid } from "nanoid"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "success" | "error" | "info"
}

// Simple module-level store
let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export const toast = {
  success: (title: string, description?: string) => {
    const id = nanoid()
    toasts = [...toasts, { id, title, description, variant: "success" }]
    notify()
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notify()
    }, 4000)
  },
  error: (title: string, description?: string) => {
    const id = nanoid()
    toasts = [...toasts, { id, title, description, variant: "error" }]
    notify()
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notify()
    }, 5000)
  },
  info: (title: string, description?: string) => {
    const id = nanoid()
    toasts = [...toasts, { id, title, description, variant: "info" }]
    notify()
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notify()
    }, 3000)
  },
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts)

  useState(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  })

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, [])

  return { toasts: state, dismiss }
}
