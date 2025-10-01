import { NextResponse } from "next/server"
import {
  getAllExpenseTransactions,
  addExpenseTransaction,
  updateExpenseTransaction,
  deleteExpenseTransaction,
} from "@/lib/neon-accounts-storage"

export async function GET() {
  try {
    console.log("[SERVER] 📡 Fetching other expenses from accounts_db...")
    const transactions = await getAllExpenseTransactions()

    // Transform to match the expected format
    const deployments = transactions.map((t) => ({
      id: t.id,
      date: t.entry_date,
      code: t.code,
      reference: "", // We'll need to fetch this from account_activities if needed
      amount: Number(t.total_amount),
      notes: t.notes || "",
      user: "System",
    }))

    console.log(`[SERVER] ✅ Fetched ${deployments.length} other expenses`)

    return NextResponse.json({
      success: true,
      deployments,
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error fetching other expenses:", error.message)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch other expenses",
        deployments: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[SERVER] Adding other expense:", body)

    const transaction = {
      entry_date: body.date,
      code: body.code,
      total_amount: body.amount,
      notes: body.notes || "",
    }

    const success = await addExpenseTransaction(transaction)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: "Failed to add other expense" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[SERVER] ❌ Error adding other expense:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    console.log("[SERVER] Updating other expense:", body.id)

    const transaction = {
      entry_date: body.date,
      code: body.code,
      total_amount: body.amount,
      notes: body.notes || "",
    }

    const success = await updateExpenseTransaction(body.id, transaction)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: "Failed to update other expense" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[SERVER] ❌ Error updating other expense:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 })
    }

    const success = await deleteExpenseTransaction(Number.parseInt(id))

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: "Failed to delete other expense" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[SERVER] ❌ Error deleting other expense:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
