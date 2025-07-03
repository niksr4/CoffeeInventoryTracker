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

export async function PUT(request: NextRequest) {
  if (!redis || !getRedisAvailability()) {
    return NextResponse.json({ success: false, error: "Database not available" }, { status: 503 })
  }

  try {
    const updatedDeployment: LaborDeployment = await request.json()
    if (!updatedDeployment.id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    const deployments = (await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)) || []
    const index = deployments.findIndex((d) => d.id === updatedDeployment.id)

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    // Recalculate total cost
    updatedDeployment.totalCost = updatedDeployment.laborEntries.reduce(
      (sum, entry) => sum + entry.laborCount * entry.costPerLabor,
      0,
    )

    deployments[index] = updatedDeployment
    await redis.set(KEYS.LABOR_DEPLOYMENTS, deployments)

    return NextResponse.json({ success: true, deployment: updatedDeployment })
  } catch (error) {
    console.error("Error in PUT /api/labor:", error)
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!redis || !getRedisAvailability()) {
    return NextResponse.json({ success: false, error: "Database not available" }, { status: 503 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    const deployments = (await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)) || []
    const updatedDeployments = deployments.filter((d) => d.id !== id)

    if (deployments.length === updatedDeployments.length) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    await redis.set(KEYS.LABOR_DEPLOYMENTS, updatedDeployments)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/labor:", error)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
