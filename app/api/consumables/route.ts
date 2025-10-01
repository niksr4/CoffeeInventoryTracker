import { type NextRequest, NextResponse } from "next/server"
import {
  getAllConsumableDeployments,
  addConsumableDeployment,
  updateConsumableDeployment,
  deleteConsumableDeployment,
} from "@/lib/neon-accounts-storage"

export type ConsumableDeployment = {
  id: string
  date: string
  code: string
  reference: string
  amount: number
  notes?: string
  user: string
}

// GET all consumable deployments
export async function GET() {
  try {
    const deployments = await getAllConsumableDeployments()
    return NextResponse.json({ deployments })
  } catch (error) {
    console.error("Error fetching consumable deployments:", error)
    return NextResponse.json({ deployments: [], error: "Failed to fetch data from database" }, { status: 500 })
  }
}

// POST a new consumable deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    await addConsumableDeployment(newDeployment)

    return NextResponse.json({ success: true, deployment: newDeployment })
  } catch (error) {
    console.error("Error in POST /api/consumables:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to save data to database" }, { status: 500 })
  }
}

// PUT (update) an existing consumable deployment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required for update" }, { status: 400 })
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date).toISOString()
    }

    const updated = await updateConsumableDeployment(id, updateData)

    if (!updated) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deployment: updated })
  } catch (error) {
    console.error("Error in PUT /api/consumables:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to update deployment" }, { status: 500 })
  }
}

// DELETE a consumable deployment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Deployment ID is required for deletion" }, { status: 400 })
    }

    const deleted = await deleteConsumableDeployment(id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Deployment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Deployment deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/consumables:", error)
    return NextResponse.json({ success: false, error: "Failed to delete deployment" }, { status: 500 })
  }
}
