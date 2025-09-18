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
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-medium text-primary flex items-center">
          <Building2 className="h-6 w-6 mr-2" />
          {tenant.name}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={tenant.plan === "enterprise" ? "default" : "secondary"} className="capitalize">
            {tenant.plan === "enterprise" && <Crown className="h-3 w-3 mr-1" />}
            {tenant.plan}
          </Badge>
          {tenant.status === "trial" && (
            <Badge variant={trialDaysLeft <= 3 ? "destructive" : "outline"}>
              <Calendar className="h-3 w-3 mr-1" />
              {trialDaysLeft} days left
            </Badge>
          )}
          {tenant.status === "active" && <Badge variant="outline">Active</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {user.role}
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {user.role}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}
