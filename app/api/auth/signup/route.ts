import { type NextRequest, NextResponse } from "next/server"
import { createTenant, createUser } from "@/lib/auth"
import { generateToken } from "@/lib/auth"
import type { SignupData } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body: SignupData = await request.json()
    const { email, password, firstName, lastName, farmName, farmSize, plan } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !farmName || !plan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Generate tenant slug from farm name
    const slug = farmName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50)

    // Create tenant and owner user
    const { tenant, user } = await createTenant({
      name: farmName,
      slug,
      ownerEmail: email,
      ownerFirstName: firstName,
      ownerLastName: lastName,
      plan,
    })

    // Create user account
    const createdUser = await createUser(tenant.id, {
      email,
      password,
      firstName,
      lastName,
      role: "owner",
    })

    // Generate JWT token
    const token = generateToken({
      userId: createdUser.id,
      tenantId: tenant.id,
      email: createdUser.email,
      role: createdUser.role,
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
        tenantId: tenant.id,
      },
      tenant,
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Signup error:", error)

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
