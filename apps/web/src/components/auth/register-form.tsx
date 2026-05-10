"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Sparkles, Check } from "lucide-react"
import { api, apiRoutes } from "@/lib/api"
import Cookies from "js-cookie"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Min 3 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
  displayName: z.string().min(2, "Min 2 characters").max(60),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
})

type FormData = z.infer<typeof schema>

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
]

export function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const planParam = params.get("plan")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch("password", "")

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const res = await api.post(apiRoutes.auth.register, {
        ...data,
        referralCode: params.get("ref") ?? undefined,
      })
      const { user, tokens } = res.data

      Cookies.set("access_token", tokens.accessToken, {
        expires: 1 / 96,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      Cookies.set("refresh_token", tokens.refreshToken, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      router.push(planParam ? `/onboarding?plan=${planParam}` : "/onboarding")
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed. Try again.")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-white">Create your account</h1>
        <p className="text-sm text-white/40">
          Already have one?{" "}
          <Link href="/login" className="text-white hover:text-white font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`}
        className="btn-outline w-full justify-center gap-2.5 py-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </a>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-white/25">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-medium text-white/60">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={cn("input", errors.email && "border-red-500/40")}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/60">Username</label>
            <input
              {...register("username")}
              type="text"
              placeholder="your_handle"
              autoComplete="username"
              className={cn("input", errors.username && "border-red-500/40")}
            />
            {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/60">Display Name</label>
            <input
              {...register("displayName")}
              type="text"
              placeholder="Alex Kim"
              className={cn("input", errors.displayName && "border-red-500/40")}
            />
            {errors.displayName && <p className="text-xs text-red-400">{errors.displayName.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/60">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn("input pr-10", errors.password && "border-red-500/40")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength indicators */}
          {password && (
            <div className="space-y-1.5 mt-2">
              {PASSWORD_RULES.map((rule) => {
                const pass = rule.test(password)
                return (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all",
                        pass ? "bg-emerald-500" : "bg-white/10"
                      )}
                    >
                      {pass && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                    </div>
                    <span className={cn("text-xs", pass ? "text-emerald-400" : "text-white/30")}>
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-white/25 leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-white/40 hover:text-white/60">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-white/40 hover:text-white/60">Privacy Policy</Link>.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3.5 text-base"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isSubmitting ? "Creating account…" : "Create Account Free"}
        </button>
      </form>
    </motion.div>
  )
}
