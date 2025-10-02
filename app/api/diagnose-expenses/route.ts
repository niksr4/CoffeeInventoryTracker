import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    // Check expense_transactions codes
    const expenseCheck = await accountsSql`
      SELECT 
        id,
        code,
        pg_typeof(code) as code_type,
        length(code) as code_length,
        ascii(substring(code, 1, 1)) as first_char_ascii
      FROM expense_transactions
      LIMIT 5
    `

    // Check account_activities codes
    const activityCheck = await accountsSql`
      SELECT 
        code,
        activity,
        pg_typeof(code) as code_type,
        length(code) as code_length,
        ascii(substring(code, 1, 1)) as first_char_ascii
      FROM account_activities
      LIMIT 5
    `

    // Test the actual JOIN with detailed output
    const joinTest = await accountsSql`
      SELECT 
        et.id,
        et.code as expense_code,
        aa.code as activity_code,
        aa.activity,
        CASE 
          WHEN aa.activity IS NOT NULL THEN 'MATCHED'
          ELSE 'NOT MATCHED'
        END as match_status
      FROM expense_transactions et
      LEFT JOIN account_activities aa ON et.code = aa.code
      ORDER BY et.id
    `

    return NextResponse.json({
      success: true,
      expenseCheck,
      activityCheck,
      joinTest,
    })
  } catch (error: any) {
    console.error("❌ Diagnosis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
