"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"

export default function TenantLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useTenantAuth()
  const router = useRouter()
  const isMobile = useIsMobile()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Invalid email or password, or your account may be suspended")
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-3 sm:px-4 py-6">
      <div className="w-full max-w-md">
        <Card className="border-0 sm:border shadow-none sm:shadow-md">
          <CardHeader className="text-center px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary mr-2" />
              <CardTitle className="text-xl sm:text-2xl text-primary">FarmTrack Pro</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base">Sign in to your farm management account</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm sm:text-base">
                  Email Address
                </Label>
                <div className="relative mt-1 sm:mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 sm:pl-10 h-12 sm:h-11 text-base sm:text-sm"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm sm:text-base">
                  Password
                </Label>
                <div className="relative mt-1 sm:mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 sm:pl-10 h-12 sm:h-11 text-base sm:text-sm"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 sm:h-11 text-base sm:text-sm" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/auth/forgot-password" className="text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>

              <div className="border-t pt-4">
                <div className="text-center text-sm text-muted-foreground mb-3">Demo Accounts:</div>
                <div className="space-y-2 text-xs sm:text-xs text-muted-foreground">
                  <div className="bg-muted/50 p-3 sm:p-2 rounded text-center sm:text-left">
                    <div className="font-medium mb-1 sm:mb-0">
                      <strong>Sunny Acres (Professional Plan):</strong>
                    </div>
                    <div className="space-y-1 sm:space-y-0">
                      <div>admin@sunnyacres.com / demo123</div>
                      <div>manager@sunnyacres.com / demo123</div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 sm:p-2 rounded text-center sm:text-left">
                    <div className="font-medium mb-1 sm:mb-0">
                      <strong>Mountain View (Starter Plan):</strong>
                    </div>
                    <div>owner@mountainview.com / demo123</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  Start free trial
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
