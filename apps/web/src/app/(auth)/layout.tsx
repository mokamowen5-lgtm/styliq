import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">
      {/* Left panel — branding */}
      <div className="hidden lg:flex relative overflow-hidden bg-black flex-col p-10 border-r border-white/[0.04]">
        {/* Subtle ambient noise */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-100" />

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <Logo size={32} showWordmark color="#ffffff" />
        </Link>

        {/* Big stylized S as background art */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="opacity-[0.04]">
            <Logo size={520} color="#ffffff" />
          </div>

          {/* Floating subtle cards on top */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-72 h-72">
              {[
                { rotate: "-8deg", x: "-30px", y: "20px", zIndex: 1, delay: "0s" },
                { rotate: "0deg", x: "0", y: "0", zIndex: 3, delay: "0.6s" },
                { rotate: "8deg", x: "30px", y: "20px", zIndex: 2, delay: "1.2s" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 glass rounded-3xl border border-white/10 shadow-card animate-float"
                  style={{
                    transform: `rotate(${s.rotate}) translateX(${s.x}) translateY(${s.y})`,
                    zIndex: s.zIndex,
                    animationDelay: s.delay,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 space-y-2">
          <p className="text-2xl font-display font-black text-white max-w-xs leading-tight">
            Curate your aesthetic.
          </p>
          <p className="text-sm text-white/40">AI-powered fashion · 2026</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center mb-8 lg:hidden">
            <Logo size={28} showWordmark color="#ffffff" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
