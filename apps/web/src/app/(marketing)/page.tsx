import { HeroSection } from "@/components/layout/hero-section"
import { FeaturesSection } from "@/components/layout/features-section"
import { StylesSection } from "@/components/layout/styles-section"
import { PricingSection } from "@/components/layout/pricing-section"
import { SocialProofSection } from "@/components/layout/social-proof-section"
import { CtaSection } from "@/components/layout/cta-section"
import { MarketingNav } from "@/components/layout/marketing-nav"
import { Footer } from "@/components/layout/footer"

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-fuchsia-600/8 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-pink-600/6 rounded-full blur-[80px] animate-pulse [animation-delay:4s]" />
      </div>

      <MarketingNav />
      <HeroSection />
      <FeaturesSection />
      <StylesSection />
      <SocialProofSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
