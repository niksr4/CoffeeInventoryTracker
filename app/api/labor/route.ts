import { type NextRequest, NextResponse } from "next/server"

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
  date: string
  user: string
}

// In-memory storage for labor deployments.
// In a real app, you'd use a database like Redis or Postgres.
const globalLaborDeployments: LaborDeployment[] = []

export async function GET() {
  // Return deployments sorted by most recent date
  const sortedDeployments = [...globalLaborDeployments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  return NextResponse.json({ deployments: sortedDeployments })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic validation
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
    }

    globalLaborDeployments.unshift(newDeployment)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("Error in POST /api/labor:", error)
    return NextResponse.json({ success: false, error: "Invalid request body or server error" }, { status: 400 })
  }
}
