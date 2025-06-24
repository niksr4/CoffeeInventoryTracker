import { type NextRequest, NextResponse } from "next/server"
import { redis, KEYS, getRedisAvailability, setRedisAvailability, checkRedisConnection } from "@/lib/redis"

// Define the structure for individual labor entries
export type LaborEntry = {
  laborCount: number
  costPerLabor: number
}

// Define the structure for individual consumable entries
export type ConsumableEntry = {
  name: string
  quantity: number
  unit: string
  costPerUnit: number
  totalCost: number // Calculated: quantity * costPerUnit
}

// Define the structure for a full labor deployment record
export type LaborDeployment = {
  id: string
  code: string
  reference: string
  laborEntries: LaborEntry[]
  otherConsumables?: ConsumableEntry[] // New field for consumables
  totalCost: number // Will now include labor + consumables
  date: string // User-selected date in ISO string format
  user: string
  notes?: string
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

// GET all labor deployments
export async function GET() {
  try {
    await ensureRedis()
    const deployments = await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)
    if (!deployments) {
      return NextResponse.json({ deployments: [] })
    }
    // Sort by the user-selected date, most recent first
    const sortedDeployments = [...deployments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return NextResponse.json({ deployments: sortedDeployments })
  } catch (error) {
    console.error("Error fetching labor deployments from Redis:", error)
    if (error instanceof Error && error.message === "Database not available") {
      return NextResponse.json({ deployments: [], error: "Database not available" }, { status: 503 })
    }
    setRedisAvailability(false)
    return NextResponse.json({ deployments: [], error: "Failed to fetch data from database" }, { status: 500 })
  }
}

// POST a new labor deployment
export async function POST(request: NextRequest) {
  try {
    await ensureRedis()
    const body = await request.json()

    // Validate required fields
    if (
      !body.code ||
      !body.reference ||
      !body.laborEntries ||
      !Array.isArray(body.laborEntries) ||
      // body.laborEntries.length === 0 || // Allow no labor if consumables are present
      !body.user ||
      !body.date // User-selected date is now required
    ) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    if (body.laborEntries.length === 0 && (!body.otherConsumables || body.otherConsumables.length === 0)) {
      return NextResponse.json(
        { success: false, error: "At least one labor entry or consumable entry is required" },
        { status: 400 },
      )
    }

    let calculatedTotalCost = 0

    // Validate and calculate cost for labor entries
    for (const entry of body.laborEntries) {
      if (
        typeof entry.laborCount !== "number" ||
        typeof entry.costPerLabor !== "number" ||
        entry.laborCount <= 0 || // Allow costPerLabor to be 0
        entry.costPerLabor < 0
      ) {
        return NextResponse.json({ success: false, error: "Invalid labor entry data" }, { status: 400 })
      }
      calculatedTotalCost += entry.laborCount * entry.costPerLabor
    }

    // Validate and calculate cost for other consumables
    const processedConsumables: ConsumableEntry[] = []
    if (body.otherConsumables && Array.isArray(body.otherConsumables)) {
      for (const consumable of body.otherConsumables) {
        if (
          !consumable.name ||
          typeof consumable.quantity !== "number" ||
          !consumable.unit ||
          typeof consumable.costPerUnit !== "number" ||
          consumable.quantity <= 0 ||
          consumable.costPerUnit < 0 // Allow 0 cost
        ) {
          return NextResponse.json({ success: false, error: "Invalid consumable entry data" }, { status: 400 })
        }
        const consumableTotal = consumable.quantity * consumable.costPerUnit
        processedConsumables.push({ ...consumable, totalCost: consumableTotal })
        calculatedTotalCost += consumableTotal
      }
    }

    const newDeployment: LaborDeployment = {
      id: `labor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      code: body.code,
      reference: body.reference,
      laborEntries: body.laborEntries,
      otherConsumables: processedConsumables.length > 0 ? processedConsumables : undefined,
      totalCost: calculatedTotalCost,
      date: new Date(body.date).toISOString(), // Store user-selected date as ISO string
      user: body.user,
      notes: body.notes || undefined,
    }

    const currentDeployments = (await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)) || []
    currentDeployments.unshift(newDeployment) // Add to the beginning

    await redis.set(KEYS.LABOR_DEPLOYMENTS, currentDeployments)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("Error in POST /api/labor:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }
    if (error instanceof Error && error.message === "Database not available") {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 503 })
    }
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to save data to database" }, { status: 500 })
  }
}

// PUT (update) an existing labor deployment
export async function PUT(request: NextRequest) {
  try {
    await ensureRedis()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required for update" }, { status: 400 })
    }

    // Basic validation for updateData (similar to POST, but fields are optional for partial updates)
    // For simplicity, we'll assume the client sends the full updated object.
    // A more robust solution would validate each field present in updateData.

    let calculatedTotalCost = 0
    if (updateData.laborEntries && Array.isArray(updateData.laborEntries)) {
      for (const entry of updateData.laborEntries) {
        if (
          typeof entry.laborCount !== "number" ||
          typeof entry.costPerLabor !== "number" ||
          entry.laborCount <= 0 ||
          entry.costPerLabor < 0
        ) {
          return NextResponse.json({ success: false, error: "Invalid labor entry data in update" }, { status: 400 })
        }
        calculatedTotalCost += entry.laborCount * entry.costPerLabor
      }
    }

    const processedConsumables: ConsumableEntry[] = []
    if (updateData.otherConsumables && Array.isArray(updateData.otherConsumables)) {
      for (const consumable of updateData.otherConsumables) {
        if (
          !consumable.name ||
          typeof consumable.quantity !== "number" ||
          !consumable.unit ||
          typeof consumable.costPerUnit !== "number" ||
          consumable.quantity <= 0 ||
          consumable.costPerUnit < 0
        ) {
          return NextResponse.json(
            { success: false, error: "Invalid consumable entry data in update" },
            { status: 400 },
          )
        }
        const consumableTotal = consumable.quantity * consumable.costPerUnit
        processedConsumables.push({ ...consumable, totalCost: consumableTotal })
        calculatedTotalCost += consumableTotal
      }
    }
    updateData.totalCost = calculatedTotalCost
    if (processedConsumables.length > 0) {
      updateData.otherConsumables = processedConsumables
    } else {
      delete updateData.otherConsumables // Remove if empty
    }

    if (updateData.date) {
      // Ensure date is stored in ISO format
      updateData.date = new Date(updateData.date).toISOString()
    }

    const currentDeployments = await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)
    if (!currentDeployments) {
      return NextResponse.json({ success: false, error: "No deployments found" }, { status: 404 })
    }

    const deploymentIndex = currentDeployments.findIndex((d) => d.id === id)
    if (deploymentIndex === -1) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    // Merge existing data with updateData
    currentDeployments[deploymentIndex] = {
      ...currentDeployments[deploymentIndex],
      ...updateData,
      totalCost: calculatedTotalCost, // Ensure totalCost is updated based on new entries
    }

    await redis.set(KEYS.LABOR_DEPLOYMENTS, currentDeployments)

    return NextResponse.json({ success: true, deployment: currentDeployments[deploymentIndex] })
  } catch (error) {
    console.error("Error in PUT /api/labor:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }
    if (error instanceof Error && error.message === "Database not available") {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 503 })
    }
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

// DELETE a labor deployment
export async function DELETE(request: NextRequest) {
  try {
    await ensureRedis()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required for deletion" }, { status: 400 })
    }

    const currentDeployments = await redis.get<LaborDeployment[]>(KEYS.LABOR_DEPLOYMENTS)
    if (!currentDeployments) {
      return NextResponse.json({ success: false, error: "No deployments found" }, { status: 404 })
    }

    const updatedDeployments = currentDeployments.filter((d) => d.id !== id)

    if (updatedDeployments.length === currentDeployments.length) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    await redis.set(KEYS.LABOR_DEPLOYMENTS, updatedDeployments)

    return NextResponse.json({ success: true, message: "Deployment deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/labor:", error)
    if (error instanceof Error && error.message === "Database not available") {
      return NextResponse.json({ success: false, error: "Database not available" }, { status: 503 })
    }
    setRedisAvailability(false)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
