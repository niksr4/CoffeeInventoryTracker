"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { setCurrentTenant } from "@/lib/tenant"

export default function SignupPage() {
  const { login } = useTenantAuth()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    farmSize: "",
    plan: "starter",
    agreeToTerms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          organizationName: formData.farmName,
          organizationType: formData.farmSize,
          plan: formData.plan,
          acceptTerms: formData.agreeToTerms,
          acceptPrivacy: formData.agreeToTerms, // Using same checkbox for both
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || "Failed to create account" })
        return
      }

      if (data.success && data.tenant && data.user) {
        // Set the tenant context directly
        setCurrentTenant(data.tenant, data.user)

        // Store session in localStorage (same as login flow)
        localStorage.setItem(
          "tenantAuthSession",
          JSON.stringify({
            tenant: data.tenant,
            user: data.user,
          }),
        )

        // Redirect to dashboard
        window.location.href = "/dashboard"
      } else {
        // Fallback to login page if tenant/user data is missing
        window.location.href = "/auth/login?message=Account created successfully"
      }
    } catch (error) {
      console.error("Signup error:", error)
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>Start your 14-day free trial of FarmTrack Pro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="farmName">Farm/Business Name</Label>
                <Input
                  id="farmName"
                  value={formData.farmName}
                  onChange={(e) => handleInputChange("farmName", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="farmSize">Farm Size</Label>
                <Select value={formData.farmSize} onValueChange={(value) => handleInputChange("farmSize", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-10 acres)</SelectItem>
                    <SelectItem value="medium">Medium (11-50 acres)</SelectItem>
                    <SelectItem value="large">Large (51-200 acres)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (200+ acres)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plan">Choose Your Plan</Label>
                <Select value={formData.plan} onValueChange={(value) => handleInputChange("plan", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter - $29/month</SelectItem>
                    <SelectItem value="professional">Professional - $79/month</SelectItem>
                    <SelectItem value="enterprise">Enterprise - $199/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {errors.general && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
                  {errors.general}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={!formData.agreeToTerms || loading}>
                {loading ? "Creating Account..." : "Start Free Trial"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
