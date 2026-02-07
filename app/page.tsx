"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import LandingPage from "@/components/landing-page"

export default function HomePage() {
  const router = useRouter()
  const { user, status } = useAuth()

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.push("/dashboard")
    }
  }, [user, status, router])

  if (status === "loading") {
    return null
  }

  if (user) {
    return null
  }

  return <LandingPage />
}
