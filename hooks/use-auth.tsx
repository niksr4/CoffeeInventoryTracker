"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Tenant } from "@/lib/tenant"

type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "owner" | "admin" | "user"
  tenantId: string
  tenant?: Tenant
}

type AuthContextType = {
  user: User | null
  tenant: Tenant | null
  login: (user: User, tenant: Tenant) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isOwner: boolean
  loading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setTenant(data.tenant)
      } else {
        setUser(null)
        setTenant(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = (newUser: User, newTenant: Tenant) => {
    setUser(newUser)
    setTenant(newTenant)
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setTenant(null)
    }
  }

  const isAuthenticated = !!user && !!tenant
  const isAdmin = user?.role === "admin" || user?.role === "owner"
  const isOwner = user?.role === "owner"

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isOwner,
        loading,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
