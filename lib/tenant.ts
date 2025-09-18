export type Tenant = {
  id: string
  name: string
  plan: "starter" | "professional" | "enterprise"
  status: "active" | "suspended" | "trial"
  createdAt: string
  trialEndsAt?: string
  maxUsers: number
  features: string[]
}

export type TenantUser = {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: "admin" | "user" | "viewer"
  status: "active" | "invited" | "suspended"
  createdAt: string
  lastLoginAt?: string
}

// Plan configurations
export const PLAN_CONFIGS = {
  starter: {
    maxUsers: 5,
    maxInventoryItems: 100,
    features: ["basic_inventory", "basic_labor", "standard_reports", "email_support"],
    price: 29,
  },
  professional: {
    maxUsers: 25,
    maxInventoryItems: -1, // unlimited
    features: [
      "unlimited_inventory",
      "advanced_labor",
      "ai_analytics",
      "priority_support",
      "custom_integrations",
      "advanced_reports",
    ],
    price: 79,
  },
  enterprise: {
    maxUsers: -1, // unlimited
    maxInventoryItems: -1, // unlimited
    features: [
      "everything_professional",
      "multi_location",
      "dedicated_support",
      "custom_training",
      "api_access",
      "white_label",
    ],
    price: 199,
  },
}

// Tenant context for current session
let currentTenant: Tenant | null = null
let currentTenantUser: TenantUser | null = null

export function setCurrentTenant(tenant: Tenant, user: TenantUser) {
  currentTenant = tenant
  currentTenantUser = user
}

export function getCurrentTenant(): Tenant | null {
  return currentTenant
}

export function getCurrentTenantUser(): TenantUser | null {
  return currentTenantUser
}

export function clearTenantContext() {
  currentTenant = null
  currentTenantUser = null
}

// Helper to check if tenant has feature
export function tenantHasFeature(feature: string): boolean {
  if (!currentTenant) return false
  const config = PLAN_CONFIGS[currentTenant.plan]
  return config.features.includes(feature) || config.features.includes("everything_professional")
}

// Helper to check user limits
export function canAddMoreUsers(): boolean {
  if (!currentTenant) return false
  const config = PLAN_CONFIGS[currentTenant.plan]
  return config.maxUsers === -1 // unlimited for now, would need to check actual count
}

// Generate tenant-specific Redis keys
export function getTenantKey(baseKey: string, tenantId?: string): string {
  const tenant = tenantId || currentTenant?.id
  if (!tenant) {
    throw new Error("No tenant context available")
  }
  return `tenant:${tenant}:${baseKey}`
}
