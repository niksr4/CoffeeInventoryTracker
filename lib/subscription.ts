export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid"

export type Subscription = {
  id: string
  tenantId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStart?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  canceledAt?: string
  createdAt: string
  updatedAt: string
  priceId: string
  quantity: number
  metadata?: Record<string, string>
}

export type Invoice = {
  id: string
  tenantId: string
  subscriptionId: string
  amount: number
  currency: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  dueDate: string
  paidAt?: string
  createdAt: string
  lineItems: InvoiceLineItem[]
}

export type InvoiceLineItem = {
  id: string
  description: string
  amount: number
  quantity: number
  unitAmount: number
  period: {
    start: string
    end: string
  }
}

export type PaymentMethod = {
  id: string
  tenantId: string
  type: "card" | "bank_account"
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: string
}

export type BillingAddress = {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

// Demo data for development
export const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub_demo_1",
    tenantId: "demo-farm-1",
    planId: "professional",
    status: "active",
    currentPeriodStart: "2024-01-01T00:00:00Z",
    currentPeriodEnd: "2024-02-01T00:00:00Z",
    cancelAtPeriodEnd: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    priceId: "price_professional_monthly",
    quantity: 1,
  },
  {
    id: "sub_demo_2",
    tenantId: "demo-farm-2",
    planId: "starter",
    status: "trialing",
    currentPeriodStart: "2024-01-15T00:00:00Z",
    currentPeriodEnd: "2024-02-15T00:00:00Z",
    trialStart: "2024-01-15T00:00:00Z",
    trialEnd: "2024-01-29T00:00:00Z",
    cancelAtPeriodEnd: false,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    priceId: "price_starter_monthly",
    quantity: 1,
  },
]

export const DEMO_INVOICES: Invoice[] = [
  {
    id: "inv_demo_1",
    tenantId: "demo-farm-1",
    subscriptionId: "sub_demo_1",
    amount: 7900, // $79.00 in cents
    currency: "usd",
    status: "paid",
    dueDate: "2024-01-01T00:00:00Z",
    paidAt: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    lineItems: [
      {
        id: "li_demo_1",
        description: "FarmTrack Pro Professional Plan",
        amount: 7900,
        quantity: 1,
        unitAmount: 7900,
        period: {
          start: "2024-01-01T00:00:00Z",
          end: "2024-02-01T00:00:00Z",
        },
      },
    ],
  },
]

export const DEMO_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm_demo_1",
    tenantId: "demo-farm-1",
    type: "card",
    last4: "4242",
    brand: "visa",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
]

// Subscription management functions
export function getSubscriptionForTenant(tenantId: string): Subscription | null {
  return DEMO_SUBSCRIPTIONS.find((sub) => sub.tenantId === tenantId) || null
}

export function getInvoicesForTenant(tenantId: string): Invoice[] {
  return DEMO_INVOICES.filter((inv) => inv.tenantId === tenantId)
}

export function getPaymentMethodsForTenant(tenantId: string): PaymentMethod[] {
  return DEMO_PAYMENT_METHODS.filter((pm) => pm.tenantId === tenantId)
}

export function isSubscriptionActive(subscription: Subscription): boolean {
  return subscription.status === "active" || subscription.status === "trialing"
}

export function getTrialDaysRemaining(subscription: Subscription): number {
  if (subscription.status !== "trialing" || !subscription.trialEnd) {
    return 0
  }
  const trialEnd = new Date(subscription.trialEnd)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function formatCurrency(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100) // Convert from cents
}

export function getNextBillingDate(subscription: Subscription): Date {
  return new Date(subscription.currentPeriodEnd)
}

export function canUpgradePlan(currentPlan: string, targetPlan: string): boolean {
  const planHierarchy = ["starter", "professional", "enterprise"]
  const currentIndex = planHierarchy.indexOf(currentPlan)
  const targetIndex = planHierarchy.indexOf(targetPlan)
  return targetIndex > currentIndex
}

export function canDowngradePlan(currentPlan: string, targetPlan: string): boolean {
  const planHierarchy = ["starter", "professional", "enterprise"]
  const currentIndex = planHierarchy.indexOf(currentPlan)
  const targetIndex = planHierarchy.indexOf(targetPlan)
  return targetIndex < currentIndex
}
