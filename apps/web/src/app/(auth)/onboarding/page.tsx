import type { Metadata } from "next"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"

export const metadata: Metadata = { title: "Setup Your Style Profile" }

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <OnboardingFlow />
    </div>
  )
}
