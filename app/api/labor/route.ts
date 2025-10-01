import { type NextRequest, NextResponse } from "next/server"
import {
  getAllLaborDeployments,
  addLaborDeployment,
  updateLaborDeployment,
  deleteLaborDeployment,
} from "@/lib/neon-accounts-storage"

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
  notes?: string
}

export async function GET() {
  try {
    const deployments = await getAllLaborDeployments()
    return NextResponse.json({ deployments })
  } catch (error) {
    console.error("GET /api/labor →", error)
    return NextResponse.json({ deployments: [], error: "Failed to fetch labor deployments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    await addLaborDeployment(newDeployment)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("POST /api/labor →", error)
    return NextResponse.json({ success: false, error: "Failed to save labor deployment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

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

    const updated = await updateLaborDeployment(id, updates)

    if (!updated) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deployment: updated })
  } catch (error) {
    console.error("PUT /api/labor →", error)
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required" }, { status: 400 })
    }

    const deleted = await deleteLaborDeployment(id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/labor →", error)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
