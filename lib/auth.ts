import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { createTenantRedis, TENANT_KEYS } from "./tenant-redis"
import type { TenantUser } from "./tenant"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = "7d"

export type AuthSession = {
  userId: string
  tenantId: string
  email: string
  role: "owner" | "admin" | "user"
  iat: number
  exp: number
}

export type LoginCredentials = {
  email: string
  password: string
  tenantSlug?: string
}

export type SignupData = {
  email: string
  password: string
  firstName: string
  lastName: string
  farmName: string
  farmSize: string
  plan: "starter" | "professional" | "enterprise"
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(payload: Omit<AuthSession, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verify JWT token
export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession
  } catch (error) {
    return null
  }
}

// Create user account
export async function createUser(
  tenantId: string,
  userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: "owner" | "admin" | "user"
  },
): Promise<TenantUser> {
  const hashedPassword = await hashPassword(userData.password)
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const user: TenantUser = {
    id: userId,
    tenantId,
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    status: "active",
    createdAt: new Date().toISOString(),
  }

  // Store user in tenant's Redis
  const tenantRedis = createTenantRedis(tenantId)
  const users = (await tenantRedis.get<TenantUser[]>(TENANT_KEYS.USERS)) || []
  users.push(user)
  await tenantRedis.set(TENANT_KEYS.USERS, users)

  // Store password separately (in real app, use a proper user database)
  await tenantRedis.set(`user:${userId}:password`, hashedPassword)

  return user
}

// Find user by email within tenant
export async function findUserByEmail(tenantId: string, email: string): Promise<TenantUser | null> {
  const tenantRedis = createTenantRedis(tenantId)
  const users = (await tenantRedis.get<TenantUser[]>(TENANT_KEYS.USERS)) || []
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
}

// Get user password hash
export async function getUserPasswordHash(tenantId: string, userId: string): Promise<string | null> {
  const tenantRedis = createTenantRedis(tenantId)
  return await tenantRedis.get<string>(`user:${userId}:password`)
}

// Authenticate user
export async function authenticateUser(tenantId: string, email: string, password: string): Promise<TenantUser | null> {
  const user = await findUserByEmail(tenantId, email)
  if (!user) return null

  const passwordHash = await getUserPasswordHash(tenantId, user.id)
  if (!passwordHash) return null

  const isValidPassword = await verifyPassword(password, passwordHash)
  if (!isValidPassword) return null

  // Update last login
  const tenantRedis = createTenantRedis(tenantId)
  const users = (await tenantRedis.get<TenantUser[]>(TENANT_KEYS.USERS)) || []
  const userIndex = users.findIndex((u) => u.id === user.id)
  if (userIndex !== -1) {
    users[userIndex].lastLoginAt = new Date().toISOString()
    await tenantRedis.set(TENANT_KEYS.USERS, users)
  }

  return user
}

// Get user by ID
export async function getUserById(tenantId: string, userId: string): Promise<TenantUser | null> {
  const tenantRedis = createTenantRedis(tenantId)
  const users = (await tenantRedis.get<TenantUser[]>(TENANT_KEYS.USERS)) || []
  return users.find((user) => user.id === userId) || null
}

// Update user
export async function updateUser(
  tenantId: string,
  userId: string,
  updates: Partial<TenantUser>,
): Promise<TenantUser | null> {
  const tenantRedis = createTenantRedis(tenantId)
  const users = (await tenantRedis.get<TenantUser[]>(TENANT_KEYS.USERS)) || []
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) return null

  users[userIndex] = { ...users[userIndex], ...updates }
  await tenantRedis.set(TENANT_KEYS.USERS, users)

  return users[userIndex]
}

// Invite user to tenant
export async function inviteUser(
  tenantId: string,
  inviterUserId: string,
  inviteData: {
    email: string
    firstName: string
    lastName: string
    role: "admin" | "user"
  },
): Promise<TenantUser> {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const user: TenantUser = {
    id: userId,
    tenantId,
    email: inviteData.email.toLowerCase(),
    firstName: inviteData.firstName,
    lastName: inviteData.lastName,
    role: inviteData.role,
    status: "invited",
    createdAt: new Date().toISOString(),
  }

  const tenantRedis = createTenantRedis(tenantId)
  const users = (await tenantRedis.get<TenantUser[]>(TENANT_KEYS.USERS)) || []
  users.push(user)
  await tenantRedis.set(TENANT_KEYS.USERS, users)

  // TODO: Send invitation email

  return user
}

// Accept invitation and set password
export async function acceptInvitation(tenantId: string, userId: string, password: string): Promise<TenantUser | null> {
  const user = await getUserById(tenantId, userId)
  if (!user || user.status !== "invited") return null

  const hashedPassword = await hashPassword(password)
  const tenantRedis = createTenantRedis(tenantId)

  // Update user status
  const updatedUser = await updateUser(tenantId, userId, {
    status: "active",
    lastLoginAt: new Date().toISOString(),
  })

  // Store password
  await tenantRedis.set(`user:${userId}:password`, hashedPassword)

  return updatedUser
}
