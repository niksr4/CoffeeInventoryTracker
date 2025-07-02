"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Coffee, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/") // Redirect to login page after logout
  }

  return (
    <header className="bg-amber-900/90 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6" />
          <h1 className="text-xl font-bold">Honey Farm Inventory System</h1>
        </div>
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-amber-800 text-white hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
