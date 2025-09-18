"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Settings,
  Crown,
  Zap,
} from "lucide-react"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { PLAN_CONFIGS } from "@/lib/tenant"
import {
  getSubscriptionForTenant,
  getInvoicesForTenant,
  getPaymentMethodsForTenant,
  formatCurrency,
  getTrialDaysRemaining,
  getNextBillingDate,
  canUpgradePlan,
  canDowngradePlan,
} from "@/lib/subscription"

export default function SubscriptionManagement() {
  const { tenant, user } = useTenantAuth()
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  if (!tenant || !user) return null

  const subscription = getSubscriptionForTenant(tenant.id)
  const invoices = getInvoicesForTenant(tenant.id)
  const paymentMethods = getPaymentMethodsForTenant(tenant.id)

  if (!subscription) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No subscription found for this tenant.</p>
      </div>
    )
  }

  const currentPlanConfig = PLAN_CONFIGS[tenant.plan]
  const trialDaysLeft = getTrialDaysRemaining(subscription)
  const nextBillingDate = getNextBillingDate(subscription)
  const defaultPaymentMethod = paymentMethods.find((pm) => pm.isDefault)

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId)
    setShowUpgradeDialog(true)
  }

  const handleCancelSubscription = () => {
    setShowCancelDialog(true)
  }

  const confirmUpgrade = () => {
    // In a real app, this would call your payment processor API
    console.log(`Upgrading to ${selectedPlan}`)
    setShowUpgradeDialog(false)
  }

  const confirmCancel = () => {
    // In a real app, this would call your subscription management API
    console.log("Canceling subscription")
    setShowCancelDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {tenant.plan === "enterprise" && <Crown className="h-5 w-5 mr-2 text-yellow-500" />}
                {tenant.plan === "professional" && <Zap className="h-5 w-5 mr-2 text-blue-500" />}
                Current Plan: {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
              </CardTitle>
              <CardDescription>
                {subscription.status === "trialing"
                  ? `${trialDaysLeft} days left in trial`
                  : `Active since ${new Date(subscription.createdAt).toLocaleDateString()}`}
              </CardDescription>
            </div>
            <Badge
              variant={
                subscription.status === "active"
                  ? "default"
                  : subscription.status === "trialing"
                    ? "secondary"
                    : "destructive"
              }
            >
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="font-semibold">${currentPlanConfig.price}/month</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
              <div>
                <p className="text-sm text-muted-foreground">Next Billing</p>
                <p className="font-semibold">{nextBillingDate.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">
                  {defaultPaymentMethod ? `•••• ${defaultPaymentMethod.last4}` : "No payment method"}
                </p>
              </div>
            </div>
          </div>

          {subscription.status === "trialing" && trialDaysLeft <= 7 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  Your trial expires in {trialDaysLeft} days. Add a payment method to continue using FarmTrack Pro.
                </p>
              </div>
            </div>
          )}

          {subscription.cancelAtPeriodEnd && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800">
                  Your subscription will be canceled on {nextBillingDate.toLocaleDateString()}.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Plans & Billing</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(PLAN_CONFIGS).map(([planId, config]) => (
              <Card key={planId} className={`relative ${tenant.plan === planId ? "ring-2 ring-primary" : ""}`}>
                {tenant.plan === planId && <Badge className="absolute -top-2 left-4">Current Plan</Badge>}
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {planId === "enterprise" && <Crown className="h-4 w-4 mr-2 text-yellow-500" />}
                    {planId === "professional" && <Zap className="h-4 w-4 mr-2 text-blue-500" />}
                    {planId.charAt(0).toUpperCase() + planId.slice(1)}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">${config.price}</span>/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {config.maxUsers === -1 ? "Unlimited users" : `Up to ${config.maxUsers} users`}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {config.maxInventoryItems === -1
                        ? "Unlimited inventory"
                        : `Up to ${config.maxInventoryItems} items`}
                    </li>
                    {config.features.includes("ai_analytics") && (
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        AI-powered analytics
                      </li>
                    )}
                    {config.features.includes("priority_support") && (
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Priority support
                      </li>
                    )}
                  </ul>

                  <div className="mt-4">
                    {tenant.plan === planId ? (
                      <Button variant="outline" className="w-full bg-transparent" disabled>
                        Current Plan
                      </Button>
                    ) : canUpgradePlan(tenant.plan, planId) ? (
                      <Button className="w-full" onClick={() => handleUpgrade(planId)}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    ) : canDowngradePlan(tenant.plan, planId) ? (
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => handleUpgrade(planId)}>
                        Downgrade
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Actions</CardTitle>
              <CardDescription>Manage your subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No invoices found.</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Invoice #{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>{invoice.status}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No payment methods on file.</p>
                  <Button>Add Payment Method</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-muted-foreground mr-3" />
                        <div>
                          <p className="font-medium">
                            {method.brand?.toUpperCase()} •••• {method.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && <Badge variant="secondary">Default</Badge>}
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent">
                    Add New Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
            <DialogDescription>
              You're about to upgrade to the {selectedPlan} plan. Your billing will be prorated for the current period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade}>Confirm Upgrade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your
              current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
