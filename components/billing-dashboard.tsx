"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { CreditCard, Calendar, AlertTriangle, CheckCircle, ExternalLink, Loader2 } from "lucide-react"
import type { Subscription } from "@/lib/stripe"
import { SUBSCRIPTION_PLANS, formatPrice, isSubscriptionActive } from "@/lib/stripe"

export default function BillingDashboard() {
  const { tenant } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription", {
        headers: {
          "x-tenant-id": tenant?.id || "",
        },
      })
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    if (!subscription) return

    setPortalLoading(true)
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: subscription.stripeCustomerId,
          returnUrl: window.location.href,
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error opening customer portal:", error)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You don't have an active subscription. Choose a plan to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Choose a Plan</Button>
        </CardContent>
      </Card>
    )
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan]
  const isActive = isSubscriptionActive(subscription.status)
  const isTrialing = subscription.status === "trialing"
  const isPastDue = subscription.status === "past_due"

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan: {plan.name}
                {isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {subscription.status}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPrice(plan.price)}</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>

              {isTrialing && subscription.trialEnd && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Trial ends: {new Date(subscription.trialEnd).toLocaleDateString()}</span>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    Subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Plan Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
                {plan.features.length > 3 && <li className="text-xs">+ {plan.features.length - 3} more features</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Management
          </CardTitle>
          <CardDescription>Manage your payment methods, view invoices, and update billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={openCustomerPortal} disabled={portalLoading}>
            {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Billing Portal
          </Button>
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Monitor your current usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Members</span>
                <span>0 / {plan.limits.maxUsers === -1 ? "Unlimited" : plan.limits.maxUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Inventory Items</span>
                <span>0 / {plan.limits.maxInventoryItems === -1 ? "Unlimited" : plan.limits.maxInventoryItems}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Upgrade */}
      {subscription.plan !== "enterprise" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>Get access to more features and higher limits</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">View All Plans</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
