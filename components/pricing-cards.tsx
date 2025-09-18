"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2 } from "lucide-react"
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/stripe"

interface PricingCardsProps {
  onSelectPlan: (plan: string) => Promise<void>
  currentPlan?: string
  loading?: boolean
}

export default function PricingCards({ onSelectPlan, currentPlan, loading = false }: PricingCardsProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleSelectPlan = async (plan: string) => {
    setSelectedPlan(plan)
    try {
      await onSelectPlan(plan)
    } catch (error) {
      console.error("Error selecting plan:", error)
    } finally {
      setSelectedPlan(null)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
        const isCurrentPlan = currentPlan === key
        const isPopular = key === "professional"
        const isLoading = selectedPlan === key || loading

        return (
          <Card
            key={key}
            className={`relative ${
              isPopular ? "border-2 border-primary shadow-xl" : "border-0 shadow-lg"
            } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}
            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-500 text-white">Current Plan</Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${isPopular ? "" : "bg-transparent"}`}
                variant={isPopular ? "default" : "outline"}
                onClick={() => handleSelectPlan(key)}
                disabled={isCurrentPlan || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCurrentPlan
                  ? "Current Plan"
                  : isLoading
                    ? "Processing..."
                    : key === "enterprise"
                      ? "Contact Sales"
                      : "Start Free Trial"}
              </Button>

              {!isCurrentPlan && key !== "enterprise" && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  14-day free trial • No credit card required
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
