import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getUserById } from "@/lib/auth"
import { getTenantById } from "@/lib/tenant"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = verifyToken(token)
    if (!session) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user and tenant information
    const [user, tenant] = await Promise.all([
      getUserById(session.tenantId, session.userId),
      getTenantById(session.tenantId),
    ])

    if (!user || !tenant) {
      return NextResponse.json({ error: "User or tenant not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: tenant.id,
      },
      tenant,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
