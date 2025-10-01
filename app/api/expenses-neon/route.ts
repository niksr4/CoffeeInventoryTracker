import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("📡 Fetching all expense transactions from accounts_db...")

    const result = await accountsSql`
      SELECT 
        id,
        entry_date as date,
        code,
        total_amount as amount,
        notes
      FROM expense_transactions
      ORDER BY entry_date DESC
    `

    // Transform the data to match the expected format
    const deployments = result.map((row: any) => ({
      id: row.id,
      date: row.date,
      code: row.code,
      reference: "", // Will be filled by join or separate query
      amount: Number.parseFloat(row.amount),
      notes: row.notes || "",
      user: "system",
    }))

    // Fetch references for all codes
    const codes = [...new Set(deployments.map((d) => d.code))]
    if (codes.length > 0) {
      const references = await accountsSql`
        SELECT code, activity as reference
        FROM account_activities
        WHERE code = ANY(${codes})
      `

      const referenceMap = new Map(references.map((r: any) => [r.code, r.reference]))

      deployments.forEach((d) => {
        d.reference = referenceMap.get(d.code) || d.code
      })
    }

    console.log(`✅ Found ${deployments.length} expense transactions`)

    return NextResponse.json({
      success: true,
      deployments,
    })
  } catch (error: any) {
    console.error("❌ Error fetching expenses:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        deployments: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, code, reference, amount, notes, user } = body

    console.log("➕ Adding new expense:", { code, reference, amount })

    const result = await accountsSql`
      INSERT INTO expense_transactions (
        entry_date,
        code,
        total_amount,
        notes
      ) VALUES (
        ${date}::timestamp,
        ${code},
        ${amount},
        ${notes}
      )
      RETURNING id
    `

    console.log("✅ Expense added successfully")

    return NextResponse.json({
      success: true,
      id: result[0].id,
    })
  } catch (error: any) {
    console.error("❌ Error adding expense:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, date, code, reference, amount, notes } = body

    console.log("📝 Updating expense:", id)

    await accountsSql`
      UPDATE expense_transactions
      SET
        entry_date = ${date}::timestamp,
        code = ${code},
        total_amount = ${amount},
        notes = ${notes}
      WHERE id = ${id}
    `

    console.log("✅ Expense updated successfully")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Error updating expense:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    console.log("🗑️ Deleting expense:", id)

    await accountsSql`
      DELETE FROM expense_transactions
      WHERE id = ${id}
    `

    console.log("✅ Expense deleted successfully")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Error deleting expense:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
