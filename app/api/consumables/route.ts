import { type NextRequest, NextResponse } from "next/server"
import { redis, getRedisAvailability, checkRedisConnection } from "@/lib/redis"
import { createTenantRedis, TENANT_KEYS } from "@/lib/tenant-redis"

// Define the structure for a consumable deployment record
export type ConsumableDeployment = {
  id: string
  date: string // User-selected date in ISO string format
  code: string
  reference: string
  amount: number // Direct amount input by user
  notes?: string
  user: string
}

// Helper to ensure Redis is connected
async function ensureRedis() {
  if (!redis) {
    await checkRedisConnection()
    if (!getRedisAvailability()) {
      console.error("Redis client not available.")
      throw new Error("Database not available")
    }
  }
}

// GET all consumable deployments
export async function GET(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    const tenantRedis = createTenantRedis(tenantId)
    const deployments = (await tenantRedis.get<ConsumableDeployment[]>(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS)) || []

    // Sort by the user-selected date, most recent first
    const sortedDeployments = [...deployments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return NextResponse.json({ deployments: sortedDeployments })
  } catch (error) {
    console.error("Error fetching consumable deployments:", error)
    return NextResponse.json({ deployments: [], error: "Failed to fetch data from database" }, { status: 500 })
  }
}

// POST a new consumable deployment
export async function POST(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    const tenantRedis = createTenantRedis(tenantId)
    const body = await request.json()

    // Validate required fields
    if (
      !body.date ||
      !body.code ||
      !body.reference ||
      typeof body.amount !== "number" ||
      body.amount < 0 ||
      !body.user
    ) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    const newDeployment: ConsumableDeployment = {
      id: `consumable-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date(body.date).toISOString(),
      code: body.code,
      reference: body.reference,
      amount: body.amount,
      notes: body.notes || undefined,
      user: body.user,
    }

    const currentDeployments = (await tenantRedis.get<ConsumableDeployment[]>(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS)) || []
    currentDeployments.unshift(newDeployment)

    await tenantRedis.set(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS, currentDeployments)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("Error in POST /api/consumables:", error)
    return NextResponse.json({ success: false, error: "Failed to save data to database" }, { status: 500 })
  }
}

// PUT (update) an existing consumable deployment
export async function PUT(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    const tenantRedis = createTenantRedis(tenantId)
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required for update" }, { status: 400 })
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date).toISOString()
    }

    const currentDeployments = (await tenantRedis.get<ConsumableDeployment[]>(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS)) || []

    const deploymentIndex = currentDeployments.findIndex((d) => d.id === id)
    if (deploymentIndex === -1) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    currentDeployments[deploymentIndex] = { ...currentDeployments[deploymentIndex], ...updateData }

    await tenantRedis.set(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS, currentDeployments)

    return NextResponse.json({ success: true, deployment: currentDeployments[deploymentIndex] })
  } catch (error) {
    console.error("Error in PUT /api/consumables:", error)
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

// DELETE a consumable deployment
export async function DELETE(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    const tenantRedis = createTenantRedis(tenantId)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required for deletion" }, { status: 400 })
    }

    const currentDeployments = (await tenantRedis.get<ConsumableDeployment[]>(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS)) || []

    const updatedDeployments = currentDeployments.filter((d) => d.id !== id)

    if (updatedDeployments.length === currentDeployments.length) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    await tenantRedis.set(TENANT_KEYS.CONSUMABLE_DEPLOYMENTS, updatedDeployments)

    return NextResponse.json({ success: true, message: "Deployment deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/consumables:", error)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
