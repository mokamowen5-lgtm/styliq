import type { Metadata } from "next"
import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free STYLIQ account",
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <RegisterForm />
    </Suspense>
  )
}
