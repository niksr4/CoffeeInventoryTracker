import { type NextRequest, NextResponse } from "next/server"
import { redis, getRedisAvailability, checkRedisConnection } from "@/lib/redis"
import { createTenantRedis, TENANT_KEYS } from "@/lib/tenant-redis"

/* ────────────────────────────────────────────────────────────────────────────
Types
─────────────────────────────────────────────────────────────────────────────*/
export type LaborEntry = {
  laborCount: number
  costPerLabor: number
}

export type LaborDeployment = {
  id: string
  code: string
  reference: string
  laborEntries: LaborEntry[]
  totalCost: number
  date: string // ISO string
  user: string
  notes?: string
}

/* ────────────────────────────────────────────────────────────────────────────
In-memory fallback store
─────────────────────────────────────────────────────────────────────────────*/
const inMemoryStore: { [tenantId: string]: LaborDeployment[] } = {}

function usingRedis() {
  return getRedisAvailability() && redis
}

async function ensureRedisConnected() {
  if (usingRedis()) return
  await checkRedisConnection()
}

/* ────────────────────────────────────────────────────────────────────────────
Helper functions
─────────────────────────────────────────────────────────────────────────────*/
async function readDeployments(tenantId: string): Promise<LaborDeployment[]> {
  if (usingRedis()) {
    const tenantRedis = createTenantRedis(tenantId)
    const data = await tenantRedis.get<LaborDeployment[]>(TENANT_KEYS.LABOR_DEPLOYMENTS)
    return data || []
  }
  return inMemoryStore[tenantId] || []
}

async function writeDeployments(tenantId: string, deployments: LaborDeployment[]) {
  if (usingRedis()) {
    const tenantRedis = createTenantRedis(tenantId)
    await tenantRedis.set(TENANT_KEYS.LABOR_DEPLOYMENTS, deployments)
  } else {
    inMemoryStore[tenantId] = deployments
  }
}

/* ────────────────────────────────────────────────────────────────────────────
Route handlers
─────────────────────────────────────────────────────────────────────────────*/
export async function GET(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    await ensureRedisConnected()
    const deployments = await readDeployments(tenantId)
    const sorted = deployments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return NextResponse.json({ deployments: sorted })
  } catch (error) {
    console.error("GET /api/labor →", error)
    return NextResponse.json({ deployments: [], error: "Failed to fetch labor deployments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    await ensureRedisConnected()
    const body = await request.json()

    /* ── Validation ─────────────────────*/
    if (
      !body.code ||
      !body.reference ||
      !Array.isArray(body.laborEntries) ||
      body.laborEntries.length === 0 ||
      !body.user ||
      !body.date
    ) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    if (body.laborEntries.every((e: LaborEntry) => e.laborCount <= 0)) {
      return NextResponse.json(
        { success: false, error: "At least one labor entry must have a count greater than 0." },
        { status: 400 },
      )
    }

    let totalCost = 0
    for (const entry of body.laborEntries) {
      if (
        typeof entry.laborCount !== "number" ||
        typeof entry.costPerLabor !== "number" ||
        entry.laborCount < 0 ||
        entry.costPerLabor < 0
      ) {
        return NextResponse.json({ success: false, error: "Invalid labor entry data" }, { status: 400 })
      }
      totalCost += entry.laborCount * entry.costPerLabor
    }

    const newDeployment: LaborDeployment = {
      id: `labor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      code: body.code,
      reference: body.reference,
      laborEntries: body.laborEntries,
      totalCost,
      date: new Date(body.date).toISOString(),
      user: body.user,
      notes: body.notes || undefined,
    }

    const existing = await readDeployments(tenantId)
    existing.unshift(newDeployment)
    await writeDeployments(tenantId, existing)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("POST /api/labor →", error)
    return NextResponse.json({ success: false, error: "Failed to save labor deployment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    await ensureRedisConnected()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    /* ── Re-calculate totalCost if laborEntries provided ─*/
    if (Array.isArray(updates.laborEntries)) {
      if (updates.laborEntries.every((e: LaborEntry) => e.laborCount <= 0)) {
        return NextResponse.json(
          { success: false, error: "At least one labor entry must have a count greater than 0." },
          { status: 400 },
        )
      }

      let totalCost = 0
      for (const entry of updates.laborEntries) {
        if (
          typeof entry.laborCount !== "number" ||
          typeof entry.costPerLabor !== "number" ||
          entry.laborCount < 0 ||
          entry.costPerLabor < 0
        ) {
          return NextResponse.json({ success: false, error: "Invalid labor entry data" }, { status: 400 })
        }
        totalCost += entry.laborCount * entry.costPerLabor
      }
      updates.totalCost = totalCost
    }

    if (updates.date) {
      updates.date = new Date(updates.date).toISOString()
    }

    const deployments = await readDeployments(tenantId)
    const idx = deployments.findIndex((d) => d.id === id)
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    deployments[idx] = { ...deployments[idx], ...updates }
    await writeDeployments(tenantId, deployments)

    return NextResponse.json({ success: true, deployment: deployments[idx] })
  } catch (error) {
    console.error("PUT /api/labor →", error)
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Extract tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 })
    }

    await ensureRedisConnected()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    const deployments = await readDeployments(tenantId)
    const filtered = deployments.filter((d) => d.id !== id)

    if (filtered.length === deployments.length) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    await writeDeployments(tenantId, filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/labor →", error)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
