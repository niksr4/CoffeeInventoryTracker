"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Package, DollarSign, BarChart3, Cloudy, LogOut, Zap } from "lucide-react"
import { useTenantAuth } from "@/hooks/use-tenant-auth"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const { logout, user, tenant } = useTenantAuth()

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Package },
    { id: "farmflow", label: "FarmFlow", icon: Zap },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "accounts", label: "Accounts", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "weather", label: "Weather", icon: Cloudy },
  ]

  const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-2 py-4 border-b">
            <Package className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="font-semibold text-sm">{tenant?.name || "Honey Farm"}</h2>
              <p className="text-xs text-muted-foreground">{user?.username}</p>
            </div>
          </div>

          <nav className="flex-1 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </nav>

          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
