import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const tables = await accountsSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    const laborColumns = await accountsSql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'labor_transactions'
      ORDER BY ordinal_position
    `

    const expenseColumns = await accountsSql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'expense_transactions'
      ORDER BY ordinal_position
    `

    const activityColumns = await accountsSql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'account_activities'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      tables,
      labor_transactions: laborColumns,
      expense_transactions: expenseColumns,
      account_activities: activityColumns,
    })
  } catch (error) {
    console.error("Error checking schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
