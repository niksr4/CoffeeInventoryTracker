"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
  username: string
  role: "admin" | "user"
}

type AuthContextType = {
  user: User | null
  login: (username: string, role: "admin" | "user") => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("inventorySystemUser")
    if (storedUser) {
      try {
        // Check if the stored data looks like JSON before parsing
        if (storedUser.trim().startsWith("{") && storedUser.trim().endsWith("}")) {
          const parsed = JSON.parse(storedUser)

          // Validate the parsed data structure
          if (parsed && typeof parsed === "object" && parsed.username && parsed.role) {
            setUser(parsed)
          } else {
            console.warn("Invalid user data structure, clearing user data")
            localStorage.removeItem("inventorySystemUser")
          }
        } else {
          console.warn("User data is not valid JSON, clearing user data")
          localStorage.removeItem("inventorySystemUser")
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("inventorySystemUser")
      }
    }
    setLoading(false)
  }, [])

  const login = (username: string, role: "admin" | "user") => {
    const newUser = { username, role }
    setUser(newUser)
    localStorage.setItem("inventorySystemUser", JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("inventorySystemUser")
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role === "admin"

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>
      {!loading && children}
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
