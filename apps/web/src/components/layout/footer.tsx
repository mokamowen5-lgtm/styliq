import Link from "next/link"
import { Logo } from "@/components/ui/logo"

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Cookies", "GDPR"],
  Social: ["TikTok", "Instagram", "Twitter", "Discord"],
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/">
              <Logo size={24} showWordmark color="#ffffff" />
            </Link>
            <p className="text-xs text-white/30 leading-relaxed max-w-[180px]">
              Curate your aesthetic. AI-powered fashion for 2026.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} STYLIQ. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-white/20">
            <span>Powered by</span>
            <span className="text-white/40 font-medium">OpenAI · Replicate</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
