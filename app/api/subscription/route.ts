import { type NextRequest, NextResponse } from "next/server"
import { createTenantRedis, TENANT_KEYS } from "@/lib/tenant-redis"
import type { Subscription } from "@/lib/stripe"

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    const tenantRedis = createTenantRedis(tenantId)
    const subscription = await tenantRedis.get<Subscription>(TENANT_KEYS.SUBSCRIPTION)

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
