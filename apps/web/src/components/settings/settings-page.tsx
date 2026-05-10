"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  User, CreditCard, Bell, Lock, Palette,
  LogOut, Save, Loader2, Crown, Check,
} from "lucide-react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { api, apiRoutes } from "@/lib/api"
import { cn, STYLE_LABELS, STYLE_EMOJIS } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

type Section = "profile" | "billing" | "notifications" | "security" | "preferences"

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Style", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
]

export function SettingsPage() {
  const router = useRouter()
  const [section, setSection] = useState<Section>("profile")

  function logout() {
    Cookies.remove("access_token")
    Cookies.remove("refresh_token")
    router.push("/login")
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-3xl font-display font-black mb-8">Settings</h1>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                section === s.id
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}

          <div className="border-t border-white/[0.06] mt-4 pt-4">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Content */}
        <div>
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {section === "profile" && <ProfileSection />}
            {section === "preferences" && <PreferencesSection />}
            {section === "billing" && <BillingSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "security" && <SecuritySection />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ProfileSection() {
  const queryClient = useQueryClient()
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get(apiRoutes.users.me)).data,
  })

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
  })

  useEffect(() => {
    if (me) {
      setForm({
        displayName: me.displayName ?? "",
        bio: me.bio ?? "",
        location: me.location ?? "",
        website: me.website ?? "",
      })
    }
  }, [me])

  const mutation = useMutation({
    mutationFn: () => api.patch(apiRoutes.users.updateProfile, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] })
      toast.success("Profile updated")
    },
    onError: () => toast.error("Could not update profile"),
  })

  return (
    <div className="card p-6 space-y-5">
      <h2 className="text-lg font-display font-bold">Profile information</h2>

      <Field label="Display name">
        <input
          type="text"
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          className="input"
          maxLength={60}
        />
      </Field>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          className="input resize-none"
          rows={3}
          maxLength={500}
          placeholder="Tell people about your style…"
        />
        <p className="text-xs text-white/25 mt-1">{form.bio.length}/500</p>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location">
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="input"
            placeholder="Paris, France"
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="input"
            placeholder="https://…"
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </div>
  )
}

function PreferencesSection() {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-display font-bold">Style preferences</h2>
      <p className="text-sm text-white/40">
        We use these to personalize your AI generations and feed.
      </p>
      <Link href="/onboarding" className="btn-outline text-sm px-4 py-2 w-fit">
        <Palette className="w-3.5 h-3.5" />
        Update style profile
      </Link>
    </div>
  )
}

function BillingSection() {
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => (await api.get(apiRoutes.subscriptions.current)).data,
  })

  const checkoutMutation = useMutation({
    mutationFn: (tier: "PREMIUM" | "VIP") =>
      api.post(apiRoutes.subscriptions.checkout, { tier }),
    onSuccess: ({ data }) => {
      if (data.url) window.location.href = data.url
    },
    onError: () => toast.error("Stripe is not configured. Add STRIPE_SECRET_KEY to your .env"),
  })

  const portalMutation = useMutation({
    mutationFn: () => api.post(apiRoutes.subscriptions.portal),
    onSuccess: ({ data }) => {
      if (data.url) window.location.href = data.url
    },
  })

  const tier = subscription?.tier ?? "FREE"

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Current plan</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-display font-black">{tier}</h2>
              {tier !== "FREE" && (
                <span className={cn(
                  "badge text-[10px] border",
                  tier === "VIP"
                    ? "bg-white/10 text-white border-white/15"
                    : "bg-white/10 text-white border-white/20"
                )}>
                  Active
                </span>
              )}
            </div>
            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-white/40 mt-2">
                {subscription.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            )}
          </div>

          {tier !== "FREE" && (
            <button
              onClick={() => portalMutation.mutate()}
              className="btn-outline text-sm px-4 py-2"
            >
              Manage
            </button>
          )}
        </div>

        {/* Usage */}
        {subscription && (
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-white/40 mb-2">AI generations today</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{subscription.generationsUsedToday}</span>
              <span className="text-sm text-white/40">
                / {tier === "FREE" ? "5" : "∞"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade options */}
      {tier === "FREE" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <PlanCard
            tier="PREMIUM"
            price="9"
            features={["Unlimited generations", "HD quality", "Virtual try-on", "No watermark"]}
            onUpgrade={() => checkoutMutation.mutate("PREMIUM")}
            isLoading={checkoutMutation.isPending && checkoutMutation.variables === "PREMIUM"}
            popular
          />
          <PlanCard
            tier="VIP"
            price="29"
            features={["Everything in Premium", "Brand design tools", "Trend analytics", "Dropshipping"]}
            onUpgrade={() => checkoutMutation.mutate("VIP")}
            isLoading={checkoutMutation.isPending && checkoutMutation.variables === "VIP"}
          />
        </div>
      )}

      {tier === "PREMIUM" && (
        <PlanCard
          tier="VIP"
          price="29"
          features={["Brand design tools", "Trend analytics", "Dropshipping integration", "Dedicated support"]}
          onUpgrade={() => checkoutMutation.mutate("VIP")}
          isLoading={checkoutMutation.isPending}
          fullWidth
        />
      )}
    </div>
  )
}

function PlanCard({
  tier, price, features, onUpgrade, isLoading, popular, fullWidth,
}: {
  tier: "PREMIUM" | "VIP"
  price: string
  features: string[]
  onUpgrade: () => void
  isLoading: boolean
  popular?: boolean
  fullWidth?: boolean
}) {
  return (
    <div className={cn(
      "rounded-3xl p-6 space-y-4",
      popular ? "gradient-border bg-black shadow-premium" : "glass",
      fullWidth && "col-span-2"
    )}>
      <div className="flex items-center gap-2">
        <Crown className={cn("w-5 h-5", tier === "VIP" ? "text-white" : "text-white")} />
        <h3 className="text-lg font-bold">{tier}</h3>
        {popular && (
          <span className="badge-brand text-[10px] ml-auto">Most popular</span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black">€{price}</span>
        <span className="text-white/30 text-sm">/month</span>
      </div>

      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/60">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={onUpgrade}
        disabled={isLoading}
        className={cn(
          "w-full py-3 text-sm font-semibold",
          popular || tier === "VIP" ? "btn-primary" : "btn-outline"
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgrade"}
      </button>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-display font-bold">Email notifications</h2>
      <NotifToggle label="New followers" defaultChecked />
      <NotifToggle label="Comments on your outfits" defaultChecked />
      <NotifToggle label="Likes on your outfits" />
      <NotifToggle label="Trending now in your styles" defaultChecked />
      <NotifToggle label="Weekly style digest" />
      <NotifToggle label="Product updates" defaultChecked />
    </div>
  )
}

function NotifToggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false)
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-white/70">{label}</span>
      <button
        onClick={() => setOn((p) => !p)}
        className={cn(
          "w-9 h-5 rounded-full relative transition-colors",
          on ? "bg-white" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            on ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  )
}

function SecuritySection() {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-display font-bold">Security</h2>
      <button className="w-full text-left p-4 rounded-xl hover:bg-white/[0.04] transition-colors">
        <p className="text-sm font-medium">Change password</p>
        <p className="text-xs text-white/40 mt-0.5">Update your account password</p>
      </button>
      <button className="w-full text-left p-4 rounded-xl hover:bg-white/[0.04] transition-colors">
        <p className="text-sm font-medium">Two-factor authentication</p>
        <p className="text-xs text-white/40 mt-0.5">Add an extra layer of security</p>
      </button>
      <button className="w-full text-left p-4 rounded-xl hover:bg-white/[0.04] transition-colors">
        <p className="text-sm font-medium">Active sessions</p>
        <p className="text-xs text-white/40 mt-0.5">Manage devices logged into your account</p>
      </button>
      <div className="pt-4 border-t border-white/[0.06]">
        <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
          Delete account
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/60">{label}</label>
      {children}
    </div>
  )
}
