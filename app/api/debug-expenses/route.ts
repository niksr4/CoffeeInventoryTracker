import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("🔍 Debugging expense data...")

    // Check account_activities table
    const activities = await accountsSql`
      SELECT code, activity
      FROM account_activities
      ORDER BY code
      LIMIT 10
    `
    console.log("📋 Activities in database:", activities)

    // Check expense_transactions table
    const expenses = await accountsSql`
      SELECT id, code, total_amount, notes
      FROM expense_transactions
      ORDER BY entry_date DESC
      LIMIT 10
    `
    console.log("💰 Expenses in database:", expenses)

    // Check the JOIN result
    const joined = await accountsSql`
      SELECT 
        et.id,
        et.code,
        et.total_amount,
        et.notes,
        aa.activity,
        aa.code as activity_code
      FROM expense_transactions et
      LEFT JOIN account_activities aa ON et.code = aa.code
      ORDER BY et.entry_date DESC
      LIMIT 10
    `
    console.log("🔗 Joined result:", joined)

    return NextResponse.json({
      success: true,
      activities,
      expenses,
      joined,
    })
  } catch (error: any) {
    console.error("❌ Debug error:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
