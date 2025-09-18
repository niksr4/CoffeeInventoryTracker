export type Tenant = {
  id: string
  name: string
  slug: string
  plan: "starter" | "professional" | "enterprise"
  status: "active" | "suspended" | "trial"
  createdAt: string
  updatedAt: string
  settings: {
    maxUsers: number
    maxInventoryItems: number
    features: string[]
  }
}

export type TenantUser = {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: "owner" | "admin" | "user"
  status: "active" | "invited" | "suspended"
  createdAt: string
  lastLoginAt?: string
}

// Tenant-scoped Redis key generator
export function getTenantKey(tenantId: string, key: string): string {
  return `tenant:${tenantId}:${key}`
}

// Extract tenant ID from various sources
export function extractTenantId(request: Request): string | null {
  // Try to get tenant ID from subdomain
  const url = new URL(request.url)
  const hostname = url.hostname

  // Check for subdomain pattern: {tenant}.farmflow.com
  const subdomainMatch = hostname.match(/^([^.]+)\.farmflow\./)
  if (subdomainMatch && subdomainMatch[1] !== "www" && subdomainMatch[1] !== "api") {
    return subdomainMatch[1]
  }

  // Try to get from custom header (for API calls)
  const headers = request.headers
  if (headers instanceof Headers) {
    const tenantHeader = headers.get("x-tenant-id")
    if (tenantHeader) {
      return tenantHeader
    }
  }

  // Try to get from path parameter
  const pathMatch = url.pathname.match(/^\/tenant\/([^/]+)/)
  if (pathMatch) {
    return pathMatch[1]
  }

  return null
}

// Validate tenant access
export async function validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
  // TODO: Implement actual tenant validation logic
  // For now, return true for development
  return true
}

// Get tenant by ID
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  // TODO: Implement actual tenant lookup
  // For now, return a mock tenant for development
  return {
    id: tenantId,
    name: `Farm ${tenantId}`,
    slug: tenantId,
    plan: "professional",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      maxUsers: 10,
      maxInventoryItems: 1000,
      features: ["inventory", "labor", "analytics", "ai-insights"],
    },
  }
}

// Create new tenant
export async function createTenant(data: {
  name: string
  slug: string
  ownerEmail: string
  ownerFirstName: string
  ownerLastName: string
  plan: "starter" | "professional" | "enterprise"
}): Promise<{ tenant: Tenant; user: TenantUser }> {
  const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const tenant: Tenant = {
    id: tenantId,
    name: data.name,
    slug: data.slug,
    plan: data.plan,
    status: "trial",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      maxUsers: data.plan === "starter" ? 3 : data.plan === "professional" ? 10 : 50,
      maxInventoryItems: data.plan === "starter" ? 100 : data.plan === "professional" ? 1000 : -1,
      features:
        data.plan === "starter"
          ? ["inventory", "labor"]
          : data.plan === "professional"
            ? ["inventory", "labor", "analytics", "ai-insights"]
            : ["inventory", "labor", "analytics", "ai-insights", "multi-farm", "api-access"],
    },
  }

  const user: TenantUser = {
    id: userId,
    tenantId,
    email: data.ownerEmail,
    firstName: data.ownerFirstName,
    lastName: data.ownerLastName,
    role: "owner",
    status: "active",
    createdAt: new Date().toISOString(),
  }

  // TODO: Save tenant and user to database

  return { tenant, user }
}
