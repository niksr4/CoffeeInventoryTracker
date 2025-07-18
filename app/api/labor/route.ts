import { type NextRequest, NextResponse } from "next/server"
import { redis, KEYS, getRedisAvailability, checkRedisConnection, setRedisAvailability } from "@/lib/redis"

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
let inMemoryStore: LaborDeployment[] = []

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
async function readDeployments(): Promise<LaborDeployment[]> {
  if (usingRedis()) {
    const data = await redis!.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)
    return data || []
  }
  return inMemoryStore
}

async function writeDeployments(deployments: LaborDeployment[]) {
  if (usingRedis()) {
    await redis!.set(KEYS.LABOR_DEPLOYMENTS, deployments)
  } else {
    inMemoryStore = deployments
  }
}

/* ────────────────────────────────────────────────────────────────────────────
  Route handlers
─────────────────────────────────────────────────────────────────────────────*/
export async function GET() {
  try {
    await ensureRedisConnected()
    const deployments = await readDeployments()
    const sorted = deployments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return NextResponse.json({ deployments: sorted })
  } catch (error) {
    console.error("GET /api/labor →", error)
    setRedisAvailability(false)
    return NextResponse.json({ deployments: [], error: "Failed to fetch labor deployments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    let totalCost = 0
    for (const entry of body.laborEntries) {
      if (
        typeof entry.laborCount !== "number" ||
        typeof entry.costPerLabor !== "number" ||
        entry.laborCount <= 0 ||
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

    const existing = await readDeployments()
    existing.unshift(newDeployment)
    await writeDeployments(existing)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("POST /api/labor →", error)
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to save labor deployment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureRedisConnected()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    /* ── Re-calculate totalCost if laborEntries provided ─*/
    if (Array.isArray(updates.laborEntries)) {
      let totalCost = 0
      for (const entry of updates.laborEntries) {
        if (
          typeof entry.laborCount !== "number" ||
          typeof entry.costPerLabor !== "number" ||
          entry.laborCount <= 0 ||
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

    const deployments = await readDeployments()
    const idx = deployments.findIndex((d) => d.id === id)
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    deployments[idx] = { ...deployments[idx], ...updates }
    await writeDeployments(deployments)

    return NextResponse.json({ success: true, deployment: deployments[idx] })
  } catch (error) {
    console.error("PUT /api/labor →", error)
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureRedisConnected()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    const deployments = await readDeployments()
    const filtered = deployments.filter((d) => d.id !== id)

    if (filtered.length === deployments.length) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    await writeDeployments(filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/labor →", error)
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
