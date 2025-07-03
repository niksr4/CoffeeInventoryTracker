"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-amber-900/90 text-white p-4 shadow-md bg-[url('/coffee-beans.png')] bg-blend-multiply bg-cover bg-center">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Coffee className="h-8 w-8" />
          <h1 className="text-2xl font-bold tracking-tight">Coffee Inventory Tracker</h1>
        </div>
        {user && (
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        )}
      </div>
    </header>
  )
}
