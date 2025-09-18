import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    description: "Perfect for small farms",
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
    features: [
      "Up to 100 inventory items",
      "Basic labor tracking",
      "Standard reports",
      "Email support",
      "3 team members",
    ],
    limits: {
      maxUsers: 3,
      maxInventoryItems: 100,
      features: ["inventory", "labor"],
    },
  },
  professional: {
    name: "Professional",
    description: "For growing operations",
    price: 79,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional",
    features: [
      "Unlimited inventory items",
      "Advanced labor management",
      "AI-powered insights",
      "Priority support",
      "Mobile app access",
      "10 team members",
    ],
    limits: {
      maxUsers: 10,
      maxInventoryItems: -1, // unlimited
      features: ["inventory", "labor", "analytics", "ai-insights"],
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "For large operations",
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    features: [
      "Everything in Professional",
      "Multi-farm management",
      "Custom integrations",
      "Dedicated support",
      "Advanced analytics",
      "50 team members",
    ],
    limits: {
      maxUsers: 50,
      maxInventoryItems: -1, // unlimited
      features: ["inventory", "labor", "analytics", "ai-insights", "multi-farm", "api-access"],
    },
  },
} as const

export type PlanType = keyof typeof SUBSCRIPTION_PLANS

// Subscription status types
export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"

export type Subscription = {
  id: string
  tenantId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  plan: PlanType
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  createdAt: string
  updatedAt: string
}

// Helper functions
export function getPlanByPriceId(priceId: string): PlanType | null {
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return key as PlanType
    }
  }
  return null
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return ["active", "trialing"].includes(status)
}

export function canAccessFeature(subscription: Subscription, feature: string): boolean {
  const plan = SUBSCRIPTION_PLANS[subscription.plan]
  return plan.limits.features.includes(feature)
}

export function hasReachedUserLimit(subscription: Subscription, currentUserCount: number): boolean {
  const plan = SUBSCRIPTION_PLANS[subscription.plan]
  return plan.limits.maxUsers !== -1 && currentUserCount >= plan.limits.maxUsers
}

export function hasReachedInventoryLimit(subscription: Subscription, currentItemCount: number): boolean {
  const plan = SUBSCRIPTION_PLANS[subscription.plan]
  return plan.limits.maxInventoryItems !== -1 && currentItemCount >= plan.limits.maxInventoryItems
}
