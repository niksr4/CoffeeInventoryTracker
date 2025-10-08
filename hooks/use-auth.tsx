"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  username: string
  role: "admin" | "user"
}

interface AuthContextType {
  user: User | null
  login: (username: string, role: "admin" | "user") => void
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from sessionStorage on mount
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log("✅ Restored user session:", parsedUser.username)
      }
    } catch (error) {
      console.error("Error loading user from sessionStorage:", error)
      sessionStorage.removeItem("user")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (username: string, role: "admin" | "user") => {
    const newUser = { username, role }
    setUser(newUser)
    sessionStorage.setItem("user", JSON.stringify(newUser))
    console.log("✅ User logged in:", username)
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("user")
    console.log("✅ User logged out")
  }

  // Don't render children until we've checked sessionStorage
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === "admin",
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
