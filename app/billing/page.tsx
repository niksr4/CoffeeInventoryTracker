"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TenantDashboardHeader from "@/components/tenant-dashboard-header"
import SubscriptionManagement from "@/components/subscription-management"
import BillingUsageDashboard from "@/components/billing-usage-dashboard"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function BillingPage() {
  const { isAuthenticated } = useTenantAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div className="w-full px-4 py-6 mx-auto">
      <div className="max-w-7xl mx-auto">
        <TenantDashboardHeader />

        <Tabs defaultValue="usage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
            <TabsTrigger value="subscription">Subscription & Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            <BillingUsageDashboard />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
