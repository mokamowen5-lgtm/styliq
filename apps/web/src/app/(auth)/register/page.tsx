import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free STYLIQ account",
}

export default function RegisterPage() {
  return <RegisterForm />
}
