import { type NextRequest, NextResponse } from "next/server"
import { redis, KEYS, getRedisAvailability, setRedisAvailability, checkRedisConnection } from "@/lib/redis"

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
  date: string // Should be ISO string
  user: string
  notes?: string
}

export async function GET() {
  if (!redis) {
    await checkRedisConnection()
    if (!getRedisAvailability()) {
      console.error("GET /api/labor: Redis client not available.")
      return NextResponse.json({ deployments: [], error: "Database not available" }, { status: 503 })
    }
  }

  try {
    const deployments = await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)
    if (!deployments) {
      return NextResponse.json({ deployments: [] })
    }
    const sortedDeployments = [...deployments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return NextResponse.json({ deployments: sortedDeployments })
  } catch (error) {
    console.error("Error fetching labor deployments from Redis:", error)
    setRedisAvailability(false)
    return NextResponse.json({ deployments: [], error: "Failed to fetch data from database" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!redis) {
    await checkRedisConnection()
    if (!getRedisAvailability()) {
      console.error("POST /api/labor: Redis client not available.")
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 503 })
    }
  }

  try {
    const body = await request.json()

    if (
      !body.code ||
      !body.reference ||
      !body.laborEntries ||
      !Array.isArray(body.laborEntries) ||
      body.laborEntries.length === 0 ||
      !body.user
    ) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    let calculatedTotalCost = 0
    for (const entry of body.laborEntries) {
      if (
        typeof entry.laborCount !== "number" ||
        typeof entry.costPerLabor !== "number" ||
        entry.laborCount <= 0 ||
        entry.costPerLabor < 0
      ) {
        return NextResponse.json({ success: false, error: "Invalid labor entry data" }, { status: 400 })
      }
      calculatedTotalCost += entry.laborCount * entry.costPerLabor
    }

    const newDeployment: LaborDeployment = {
      id: `labor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      code: body.code,
      reference: body.reference,
      laborEntries: body.laborEntries,
      totalCost: calculatedTotalCost,
      date: new Date().toISOString(),
      user: body.user,
      notes: body.notes || undefined,
    }

    const currentDeployments = (await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)) || []
    currentDeployments.unshift(newDeployment)

    await redis.set(KEYS.LABOR_DEPLOYMENTS, currentDeployments)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("Error in POST /api/labor:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to save data to database" }, { status: 500 })
  }
}
