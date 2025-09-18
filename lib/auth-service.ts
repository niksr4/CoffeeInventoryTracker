import { redis, safeRedisOperation } from "./redis"
import { getTenantKey } from "./tenant"

export type AuthSession = {
  id: string
  userId: string
  tenantId: string
  createdAt: string
  expiresAt: string
  lastAccessedAt: string
  ipAddress?: string
  userAgent?: string
}

export type PasswordResetToken = {
  id: string
  userId: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export type EmailVerificationToken = {
  id: string
  userId: string
  email: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export type UserInvitation = {
  id: string
  tenantId: string
  email: string
  role: "admin" | "user" | "viewer"
  invitedBy: string
  token: string
  expiresAt: string
  acceptedAt?: string
  createdAt: string
  status: "pending" | "accepted" | "expired"
}

// Demo data for development
export const DEMO_SESSIONS: AuthSession[] = [
  {
    id: "session_1",
    userId: "user-1",
    tenantId: "demo-farm-1",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-01-08T00:00:00Z",
    lastAccessedAt: "2024-01-01T12:00:00Z",
  },
]

export const DEMO_INVITATIONS: UserInvitation[] = [
  {
    id: "inv_1",
    tenantId: "demo-farm-1",
    email: "newuser@sunnyacres.com",
    role: "user",
    invitedBy: "user-1",
    token: "inv_token_123",
    expiresAt: "2024-01-08T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    status: "pending",
  },
]

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate secure tokens
export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Hash password (in production, use bcrypt or similar)
export async function hashPassword(password: string): Promise<string> {
  // This is a simple demo hash - in production use bcrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_demo_key")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Session management
export async function createSession(userId: string, tenantId: string): Promise<AuthSession> {
  const session: AuthSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    userId,
    tenantId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    lastAccessedAt: new Date().toISOString(),
  }

  // In production, store in Redis with expiration
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const sessionKey = getTenantKey(`session:${session.id}`, tenantId)
    await redis.setex(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(session)) // 7 days TTL
  })

  return session
}

export async function getSession(sessionId: string, tenantId: string): Promise<AuthSession | null> {
  return safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const sessionKey = getTenantKey(`session:${sessionId}`, tenantId)
    const sessionData = await redis.get<string>(sessionKey)
    if (!sessionData) return null

    const session: AuthSession = JSON.parse(sessionData)

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await redis.del(sessionKey)
      return null
    }

    // Update last accessed time
    session.lastAccessedAt = new Date().toISOString()
    await redis.setex(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(session))

    return session
  }, null)
}

export async function deleteSession(sessionId: string, tenantId: string): Promise<void> {
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const sessionKey = getTenantKey(`session:${sessionId}`, tenantId)
    await redis.del(sessionKey)
  })
}

// Password reset tokens
export async function createPasswordResetToken(userId: string): Promise<PasswordResetToken> {
  const token: PasswordResetToken = {
    id: `reset_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    userId,
    token: generateSecureToken(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    used: false,
    createdAt: new Date().toISOString(),
  }

  // Store in Redis with expiration
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const tokenKey = `password_reset:${token.token}`
    await redis.setex(tokenKey, 60 * 60, JSON.stringify(token)) // 1 hour TTL
  })

  return token
}

export async function getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  return safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const tokenKey = `password_reset:${token}`
    const tokenData = await redis.get<string>(tokenKey)
    if (!tokenData) return null

    const resetToken: PasswordResetToken = JSON.parse(tokenData)

    // Check if token is expired or used
    if (new Date(resetToken.expiresAt) < new Date() || resetToken.used) {
      await redis.del(tokenKey)
      return null
    }

    return resetToken
  }, null)
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const tokenKey = `password_reset:${token}`
    const tokenData = await redis.get<string>(tokenKey)
    if (tokenData) {
      const resetToken: PasswordResetToken = JSON.parse(tokenData)
      resetToken.used = true
      await redis.setex(tokenKey, 60 * 60, JSON.stringify(resetToken))
    }
  })
}

// Email verification
export async function createEmailVerificationToken(userId: string, email: string): Promise<EmailVerificationToken> {
  const token: EmailVerificationToken = {
    id: `verify_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    userId,
    email,
    token: generateSecureToken(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    used: false,
    createdAt: new Date().toISOString(),
  }

  // Store in Redis with expiration
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const tokenKey = `email_verify:${token.token}`
    await redis.setex(tokenKey, 24 * 60 * 60, JSON.stringify(token)) // 24 hours TTL
  })

  return token
}

// User invitations
export async function createUserInvitation(
  tenantId: string,
  email: string,
  role: "admin" | "user" | "viewer",
  invitedBy: string,
): Promise<UserInvitation> {
  const invitation: UserInvitation = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    tenantId,
    email,
    role,
    invitedBy,
    token: generateSecureToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    createdAt: new Date().toISOString(),
    status: "pending",
  }

  // Store in Redis with expiration
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const invitationKey = getTenantKey(`invitation:${invitation.token}`, tenantId)
    await redis.setex(invitationKey, 7 * 24 * 60 * 60, JSON.stringify(invitation)) // 7 days TTL
  })

  return invitation
}

export async function getInvitation(token: string): Promise<UserInvitation | null> {
  // We need to search across all tenants for the invitation
  // In production, you might store a global mapping
  return safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")

    // For demo, check known tenants
    const tenantIds = ["demo-farm-1", "demo-farm-2"]

    for (const tenantId of tenantIds) {
      const invitationKey = getTenantKey(`invitation:${token}`, tenantId)
      const invitationData = await redis.get<string>(invitationKey)

      if (invitationData) {
        const invitation: UserInvitation = JSON.parse(invitationData)

        // Check if invitation is expired
        if (new Date(invitation.expiresAt) < new Date()) {
          await redis.del(invitationKey)
          continue
        }

        return invitation
      }
    }

    return null
  }, null)
}

export async function acceptInvitation(token: string): Promise<UserInvitation | null> {
  const invitation = await getInvitation(token)
  if (!invitation) return null

  invitation.status = "accepted"
  invitation.acceptedAt = new Date().toISOString()

  // Update in Redis
  await safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis not available")
    const invitationKey = getTenantKey(`invitation:${token}`, invitation.tenantId)
    await redis.setex(invitationKey, 7 * 24 * 60 * 60, JSON.stringify(invitation))
  })

  return invitation
}

// Get invitations for a tenant
export async function getTenantInvitations(tenantId: string): Promise<UserInvitation[]> {
  // In production, you'd maintain an index of invitations per tenant
  // For demo, return mock data
  return DEMO_INVITATIONS.filter((inv) => inv.tenantId === tenantId)
}
