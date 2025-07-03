"use client"

import InventorySystem from "@/components/inventory-system"
import { Header } from "@/components/header"
import { useAuth } from "@/hooks/use-auth"
import LoginPage from "@/components/login-page"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <InventorySystem />
      </main>
    </div>
  )
}
