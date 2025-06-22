import { type NextRequest, NextResponse } from "next/server"

export type LaborDeployment = {
  id: string
  code: string
  reference: string
  laborCount: number
  costPerLabor: number
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
    if (!body.code || !body.reference || !body.laborCount || !body.costPerLabor || !body.user) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const newDeployment: LaborDeployment = {
      id: `labor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      code: body.code,
      reference: body.reference,
      laborCount: Number(body.laborCount),
      costPerLabor: Number(body.costPerLabor),
      totalCost: Number(body.laborCount) * Number(body.costPerLabor),
      date: new Date().toISOString(),
      user: body.user,
    }

    globalLaborDeployments.unshift(newDeployment)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
  }
}
