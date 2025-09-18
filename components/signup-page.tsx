"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { validatePassword, validateEmail } from "@/lib/auth-service"
import { PLAN_CONFIGS } from "@/lib/tenant"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<"account" | "organization" | "verification">("account")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    // Personal info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Organization info
    organizationName: "",
    organizationType: "",
    plan: "starter",

    // Agreements
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const validatePasswordStrength = (password: string) => {
    const validation = validatePassword(password)
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
    return validation.valid
  }

  const validateAccountStep = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!validatePasswordStrength(formData.password)) {
      newErrors.password = "Password does not meet requirements"
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOrganizationStep = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required"
    }
    if (!formData.organizationType) {
      newErrors.organizationType = "Organization type is required"
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms of service"
    }
    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = "You must accept the privacy policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAccountNext = () => {
    if (validateAccountStep()) {
      setStep("organization")
    }
  }

  const handleSignup = async () => {
    if (!validateOrganizationStep()) return

    setLoading(true)
    try {
      // In production, this would call your signup API
      console.log("Creating account:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setStep("verification")
    } catch (error) {
      console.error("Signup error:", error)
      setErrors({ general: "Failed to create account. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    // In production, resend verification email
    console.log("Resending verification email to:", formData.email)
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to <strong>{formData.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>Click the link in the email to verify your account and complete setup.</p>
                <p className="mt-2">Didn't receive the email? Check your spam folder.</p>
              </div>

              <Button variant="outline" className="w-full bg-transparent" onClick={handleResendVerification}>
                Resend Verification Email
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary mr-2" />
              <CardTitle className="text-2xl text-primary">FarmTrack Pro</CardTitle>
            </div>
            <CardDescription>{step === "account" ? "Create your account" : "Set up your organization"}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "account" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"
                  }`}
                >
                  {step === "account" ? "1" : <CheckCircle className="h-4 w-4" />}
                </div>
                <div className={`w-12 h-0.5 ${step === "organization" ? "bg-primary" : "bg-muted"}`} />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "organization" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
              </div>
            </div>

            {errors.general && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm border border-destructive/20">
                {errors.general}
              </div>
            )}

            {step === "account" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                    </div>
                    {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Smith"
                        className={errors.lastName ? "border-destructive" : ""}
                      />
                    </div>
                    {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      placeholder="john@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value })
                        validatePasswordStrength(e.target.value)
                      }}
                      className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs">
                        {passwordValidation.length ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                        )}
                        At least 8 characters
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.uppercase ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                        )}
                        One uppercase letter
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.lowercase ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                        )}
                        One lowercase letter
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.number ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                        )}
                        One number
                      </div>
                      <div className="flex items-center text-xs">
                        {passwordValidation.special ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground mr-1" />
                        )}
                        One special character
                      </div>
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button onClick={handleAccountNext} className="w-full">
                  Continue
                </Button>
              </div>
            )}

            {step === "organization" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className={`pl-10 ${errors.organizationName ? "border-destructive" : ""}`}
                      placeholder="Sunny Acres Farm"
                    />
                  </div>
                  {errors.organizationName && (
                    <p className="text-sm text-destructive mt-1">{errors.organizationName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="organizationType">Organization Type</Label>
                  <Select
                    value={formData.organizationType}
                    onValueChange={(value) => setFormData({ ...formData, organizationType: value })}
                  >
                    <SelectTrigger className={errors.organizationType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small_farm">Small Farm (1-50 acres)</SelectItem>
                      <SelectItem value="medium_farm">Medium Farm (51-500 acres)</SelectItem>
                      <SelectItem value="large_farm">Large Farm (500+ acres)</SelectItem>
                      <SelectItem value="cooperative">Agricultural Cooperative</SelectItem>
                      <SelectItem value="agribusiness">Agribusiness</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationType && (
                    <p className="text-sm text-destructive mt-1">{errors.organizationType}</p>
                  )}
                </div>

                <div>
                  <Label>Choose Your Plan</Label>
                  <div className="grid gap-3 mt-2">
                    {Object.entries(PLAN_CONFIGS).map(([planId, config]) => (
                      <div
                        key={planId}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          formData.plan === planId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setFormData({ ...formData, plan: planId })}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium capitalize">{planId}</div>
                            <div className="text-sm text-muted-foreground">
                              ${config.price}/month • {config.maxUsers === -1 ? "Unlimited" : config.maxUsers} users
                            </div>
                          </div>
                          <div className="text-lg font-bold">${config.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: !!checked })}
                      className={errors.acceptTerms ? "border-destructive" : ""}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm leading-5">
                      I agree to the{" "}
                      <Link href="/legal/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptPrivacy: !!checked })}
                      className={errors.acceptPrivacy ? "border-destructive" : ""}
                    />
                    <Label htmlFor="acceptPrivacy" className="text-sm leading-5">
                      I agree to the{" "}
                      <Link href="/legal/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.acceptPrivacy && <p className="text-sm text-destructive">{errors.acceptPrivacy}</p>}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptMarketing: !!checked })}
                    />
                    <Label htmlFor="acceptMarketing" className="text-sm leading-5">
                      I'd like to receive product updates and marketing emails
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("account")} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleSignup} disabled={loading} className="flex-1">
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </div>
            )}

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
