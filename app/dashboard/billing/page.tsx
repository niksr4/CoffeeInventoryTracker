import BillingDashboard from "@/components/billing-dashboard"

export default function BillingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and billing information</p>
      </div>

      <BillingDashboard />
    </div>
  )
}
