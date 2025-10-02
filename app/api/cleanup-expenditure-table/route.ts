import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("🗑️ Dropping unused expenditure_summary table...")

    await accountsSql`
      DROP TABLE IF EXISTS expenditure_summary CASCADE
    `

    console.log("✅ Successfully dropped expenditure_summary table")

    return NextResponse.json({
      success: true,
      message: "Expenditure summary table dropped successfully",
    })
  } catch (error) {
    console.error("❌ Error dropping expenditure_summary table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
