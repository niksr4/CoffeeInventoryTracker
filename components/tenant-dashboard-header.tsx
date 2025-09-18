"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, Building2, Crown, Users, Calendar } from "lucide-react"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { useRouter } from "next/navigation"
import { PLAN_CONFIGS } from "@/lib/tenant"

export default function TenantDashboardHeader() {
  const { tenant, user, logout } = useTenantAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!tenant || !user) return null

  const planConfig = PLAN_CONFIGS[tenant.plan]
  const isTrialExpiringSoon = tenant.status === "trial" && tenant.trialEndsAt
  const trialDaysLeft = isTrialExpiringSoon
    ? Math.ceil((new Date(tenant.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <header className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-6 bg-card rounded-lg border">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-medium text-primary flex items-center mb-2">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
            <span className="truncate">{tenant.name}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={tenant.plan === "enterprise" ? "default" : "secondary"} className="capitalize text-xs">
              {tenant.plan === "enterprise" && <Crown className="h-3 w-3 mr-1" />}
              {tenant.plan}
            </Badge>
            {tenant.status === "trial" && (
              <Badge variant={trialDaysLeft <= 3 ? "destructive" : "outline"} className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {trialDaysLeft} days left
              </Badge>
            )}
            {tenant.status === "active" && (
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:text-right">
              <div className="text-sm sm:text-base font-medium truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-muted-foreground flex items-center sm:justify-end">
                <Users className="h-3 w-3 mr-1" />
                {user.role}
              </div>
            </div>
            <Badge variant="outline" className="capitalize text-xs flex-shrink-0">
              {user.role}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full sm:w-auto h-9 bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
