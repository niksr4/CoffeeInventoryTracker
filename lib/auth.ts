import { redis, safeRedisOperation } from "./redis"
import { getTenantKey, type Tenant, type TenantUser, PLAN_CONFIGS } from "./tenant"
import { createUserInvitation } from "./auth-service"

export type CreateTenantRequest = {
  name: string
  email: string
  plan: "starter" | "professional" | "enterprise"
  adminFirstName?: string
  adminLastName?: string
}

export type CreateTenantResponse = {
  tenant: Tenant
  adminUser: TenantUser
  invitationToken?: string
}

export async function createTenant(request: CreateTenantRequest): Promise<CreateTenantResponse> {
  const { name, email, plan, adminFirstName = "Admin", adminLastName = "User" } = request

  // Validate input
  if (!name || !email || !plan) {
    throw new Error("Missing required fields: name, email, and plan are required")
  }

  if (!PLAN_CONFIGS[plan]) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  // Generate unique IDs
  const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2)}`
  const adminUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`

  // Create tenant object
  const tenant: Tenant = {
    id: tenantId,
    name,
    plan,
    status: "trial", // Start with trial
    createdAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
    maxUsers: PLAN_CONFIGS[plan].maxUsers,
    features: PLAN_CONFIGS[plan].features,
  }

  // Create admin user
  const adminUser: TenantUser = {
    id: adminUserId,
    tenantId,
    email,
    firstName: adminFirstName,
    lastName: adminLastName,
    role: "admin",
    status: "active",
    createdAt: new Date().toISOString(),
  }

  // Store tenant and user in Redis
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")

    // Store tenant
    const tenantKey = `tenant:${tenantId}`
    await redis.set(tenantKey, JSON.stringify(tenant))

    // Store user
    const userKey = getTenantKey(`user:${adminUserId}`, tenantId)
    await redis.set(userKey, JSON.stringify(adminUser))

    // Store user email mapping for login
    const emailKey = getTenantKey(`user_email:${email}`, tenantId)
    await redis.set(emailKey, adminUserId)

    // Initialize tenant storage
    const inventoryKey = getTenantKey("inventory", tenantId)
    await redis.set(inventoryKey, JSON.stringify([]))

    const laborKey = getTenantKey("labor", tenantId)
    await redis.set(laborKey, JSON.stringify([]))

    const transactionsKey = getTenantKey("transactions", tenantId)
    await redis.set(transactionsKey, JSON.stringify([]))
  })

  // Create invitation token for setup
  const invitation = await createUserInvitation(tenantId, email, "admin", "system")

  return {
    tenant,
    adminUser,
    invitationToken: invitation.token,
  }
}

export async function tenantExists(tenantId: string): Promise<boolean> {
  return safeRedisOperation(async () => {
    if (!redis) return false
    const tenantKey = `tenant:${tenantId}`
    const tenant = await redis.get(tenantKey)
    return !!tenant
  }, false)
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  return safeRedisOperation(async () => {
    if (!redis) return null
    const tenantKey = `tenant:${tenantId}`
    const tenantData = await redis.get<string>(tenantKey)
    return tenantData ? JSON.parse(tenantData) : null
  }, null)
}

export async function updateTenantStatus(tenantId: string, status: "active" | "suspended" | "trial"): Promise<void> {
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")

    const tenant = await getTenant(tenantId)
    if (!tenant) throw new Error("Tenant not found")

    tenant.status = status
    const tenantKey = `tenant:${tenantId}`
    await redis.set(tenantKey, JSON.stringify(tenant))
  })
}

export async function getAllTenants(): Promise<Tenant[]> {
  return safeRedisOperation(async () => {
    if (!redis) return []

    // In production, you'd maintain an index of all tenants
    // For now, return demo data or implement tenant scanning
    const keys = await redis.keys("tenant:*")
    const tenants: Tenant[] = []

    for (const key of keys) {
      if (!key.includes(":user:") && !key.includes(":inventory")) {
        const tenantData = await redis.get<string>(key)
        if (tenantData) {
          tenants.push(JSON.parse(tenantData))
        }
      }
    }

    return tenants
  }, [])
}
