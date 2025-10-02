import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("📡 Fetching all expense transactions from accounts_db...")

    const result = await accountsSql`
      SELECT 
        et.id,
        et.entry_date as date,
        et.code,
        COALESCE(aa.activity, et.code) as reference,
        et.total_amount as amount,
        et.notes
      FROM expense_transactions et
      LEFT JOIN account_activities aa ON et.code = aa.code
      ORDER BY et.entry_date DESC
    `

    console.log("📊 Sample raw result:", JSON.stringify(result[0], null, 2))

    // Transform the data to match the expected format
    const deployments = result.map((row: any) => ({
      id: row.id,
      date: row.date,
      code: row.code,
      reference: row.reference, // Use the reference from the JOIN
      amount: Number.parseFloat(row.amount),
      notes: row.notes || "",
      user: "system",
    }))

    console.log(`✅ Found ${deployments.length} expense transactions`)
    if (deployments.length > 0) {
      console.log("📋 First deployment:", JSON.stringify(deployments[0], null, 2))
    }

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
        ${notes || ""}
      )
      RETURNING id
    `

    console.log("✅ Expense added successfully with ID:", result[0].id)

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

    console.log("📝 Updating expense:", id, { code, reference, amount })

    await accountsSql`
      UPDATE expense_transactions
      SET
        entry_date = ${date}::timestamp,
        code = ${code},
        total_amount = ${amount},
        notes = ${notes || ""}
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
