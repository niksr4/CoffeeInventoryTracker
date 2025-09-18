import { type NextRequest, NextResponse } from "next/server"
import { createTenant } from "@/lib/auth"
import { validateEmail, validatePassword, hashPassword } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      organizationName,
      organizationType,
      plan = "starter",
      acceptTerms,
      acceptPrivacy,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !organizationName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: "Password does not meet requirements", details: passwordValidation.errors },
        { status: 400 },
      )
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    // Validate terms acceptance
    if (!acceptTerms || !acceptPrivacy) {
      return NextResponse.json({ error: "You must accept the terms of service and privacy policy" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create the tenant and user account
    const result = await createTenant({
      name: organizationName,
      type: organizationType || "small_farm",
      plan,
      adminUser: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create account" }, { status: 400 })
    }

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      tenantId: result.tenant?.id,
      userId: result.user?.id,
    })
  } catch (error) {
    console.error("Signup API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
