"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import PricingCards from "@/components/pricing-cards"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const router = useRouter()
  const { user, tenant } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (plan: string) => {
    if (plan === "enterprise") {
      // Redirect to contact sales
      window.location.href = "mailto:sales@farmflow.com?subject=Enterprise Plan Inquiry"
      return
    }

    if (!user || !tenant) {
      // Redirect to signup with plan selection
      router.push(`/signup?plan=${plan}`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          tenantId: tenant.id,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your farm's needs. All plans include a 14-day free trial.
          </p>
        </div>

        <PricingCards onSelectPlan={handleSelectPlan} currentPlan={tenant?.plan} loading={loading} />

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Need Help Choosing?</h3>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you find the right plan for your operation.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  )
}
