"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Database, BarChart3, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { useTenantInventoryData } from "@/hooks/use-tenant-inventory-data"
import { PLAN_CONFIGS } from "@/lib/tenant"
import { getSubscriptionForTenant, getTrialDaysRemaining } from "@/lib/subscription"

export default function BillingUsageDashboard() {
  const { tenant } = useTenantAuth()
  const { inventory, transactions } = useTenantInventoryData()

  if (!tenant) return null

  const subscription = getSubscriptionForTenant(tenant.id)
  const planConfig = PLAN_CONFIGS[tenant.plan]
  const trialDaysLeft = subscription ? getTrialDaysRemaining(subscription) : 0

  // Calculate usage metrics
  const currentUsers = 3 // In real app, this would come from user management
  const currentInventoryItems = inventory.length
  const monthlyTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return transactionDate >= thirtyDaysAgo
  }).length

  // Calculate usage percentages
  const userUsagePercent = planConfig.maxUsers === -1 ? 0 : (currentUsers / planConfig.maxUsers) * 100
  const inventoryUsagePercent =
    planConfig.maxInventoryItems === -1 ? 0 : (currentInventoryItems / planConfig.maxInventoryItems) * 100

  const isNearUserLimit = userUsagePercent > 80
  const isNearInventoryLimit = inventoryUsagePercent > 80

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUsers}</div>
            <p className="text-xs text-muted-foreground">
              {planConfig.maxUsers === -1 ? "Unlimited" : `of ${planConfig.maxUsers} allowed`}
            </p>
            {planConfig.maxUsers !== -1 && <Progress value={userUsagePercent} className="mt-2" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentInventoryItems}</div>
            <p className="text-xs text-muted-foreground">
              {planConfig.maxInventoryItems === -1 ? "Unlimited" : `of ${planConfig.maxInventoryItems} allowed`}
            </p>
            {planConfig.maxInventoryItems !== -1 && <Progress value={inventoryUsagePercent} className="mt-2" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyTransactions}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{tenant.plan}</div>
            <p className="text-xs text-muted-foreground">
              {subscription?.status === "trialing" ? `${trialDaysLeft} days left` : "Active subscription"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Warnings */}
      {(isNearUserLimit || isNearInventoryLimit || (subscription?.status === "trialing" && trialDaysLeft <= 7)) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Usage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isNearUserLimit && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">You're approaching your user limit</p>
                <Badge variant="outline">
                  {currentUsers}/{planConfig.maxUsers} users
                </Badge>
              </div>
            )}
            {isNearInventoryLimit && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">You're approaching your inventory item limit</p>
                <Badge variant="outline">
                  {currentInventoryItems}/{planConfig.maxInventoryItems} items
                </Badge>
              </div>
            )}
            {subscription?.status === "trialing" && trialDaysLeft <= 7 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">Your trial expires soon</p>
                <Badge variant="outline">{trialDaysLeft} days left</Badge>
              </div>
            )}
            <Button size="sm" className="mt-2">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feature Access */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>Features available in your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {planConfig.features.map((feature) => (
              <div key={feature} className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <span className="text-sm capitalize">{feature.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
