"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Tenant, TenantUser } from "@/lib/tenant"
import { setCurrentTenant, clearTenantContext, PLAN_CONFIGS } from "@/lib/tenant"

type TenantAuthContextType = {
  tenant: Tenant | null
  user: TenantUser | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  canAccess: (feature: string) => boolean
  loading: boolean
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined)

// Demo tenants for development
const DEMO_TENANTS: Tenant[] = [
  {
    id: "demo-farm-1",
    name: "Sunny Acres Honey Farm",
    plan: "professional",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    maxUsers: 25,
    features: PLAN_CONFIGS.professional.features,
  },
  {
    id: "demo-farm-2",
    name: "Mountain View Apiary",
    plan: "starter",
    status: "trial",
    createdAt: "2024-01-15T00:00:00Z",
    trialEndsAt: "2024-02-15T00:00:00Z",
    maxUsers: 5,
    features: PLAN_CONFIGS.starter.features,
  },
]

// Demo users for development
const DEMO_USERS: TenantUser[] = [
  {
    id: "user-1",
    tenantId: "demo-farm-1",
    email: "admin@sunnyacres.com",
    firstName: "John",
    lastName: "Smith",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-2",
    tenantId: "demo-farm-1",
    email: "manager@sunnyacres.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "user",
    status: "active",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "user-3",
    tenantId: "demo-farm-2",
    email: "owner@mountainview.com",
    firstName: "Mike",
    lastName: "Chen",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15T00:00:00Z",
  },
]

// Demo credentials for development
const DEMO_CREDENTIALS = [
  { email: "admin@sunnyacres.com", password: "demo123" },
  { email: "manager@sunnyacres.com", password: "demo123" },
  { email: "owner@mountainview.com", password: "demo123" },
]

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [user, setUser] = useState<TenantUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user session exists in localStorage
    const storedSession = localStorage.getItem("tenantAuthSession")
    if (storedSession) {
      try {
        const { tenant: storedTenant, user: storedUser } = JSON.parse(storedSession)
        setTenant(storedTenant)
        setUser(storedUser)
        setCurrentTenant(storedTenant, storedUser)
      } catch (error) {
        console.error("Error parsing stored session:", error)
        localStorage.removeItem("tenantAuthSession")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check demo credentials
    const validCredential = DEMO_CREDENTIALS.find((cred) => cred.email === email && cred.password === password)

    if (!validCredential) {
      return false
    }

    // Find user and tenant
    const foundUser = DEMO_USERS.find((u) => u.email === email)
    const foundTenant = DEMO_TENANTS.find((t) => t.id === foundUser?.tenantId)

    if (!foundUser || !foundTenant) {
      return false
    }

    // Check tenant status
    if (foundTenant.status === "suspended") {
      return false
    }

    // Check trial expiration
    if (foundTenant.status === "trial" && foundTenant.trialEndsAt) {
      const trialEnd = new Date(foundTenant.trialEndsAt)
      if (trialEnd < new Date()) {
        return false
      }
    }

    // Set session
    setTenant(foundTenant)
    setUser(foundUser)
    setCurrentTenant(foundTenant, foundUser)

    // Store session
    localStorage.setItem(
      "tenantAuthSession",
      JSON.stringify({
        tenant: foundTenant,
        user: foundUser,
      }),
    )

    return true
  }

  const logout = () => {
    setTenant(null)
    setUser(null)
    clearTenantContext()
    localStorage.removeItem("tenantAuthSession")
  }

  const canAccess = (feature: string): boolean => {
    if (!tenant) return false
    const config = PLAN_CONFIGS[tenant.plan]
    return config.features.includes(feature) || config.features.includes("everything_professional")
  }

  const isAuthenticated = !!user && !!tenant
  const isAdmin = user?.role === "admin"

  return (
    <TenantAuthContext.Provider
      value={{
        tenant,
        user,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        canAccess,
        loading,
      }}
    >
      {!loading && children}
    </TenantAuthContext.Provider>
  )
}

export function useTenantAuth() {
  const context = useContext(TenantAuthContext)
  if (context === undefined) {
    throw new Error("useTenantAuth must be used within a TenantAuthProvider")
  }
  return context
}
