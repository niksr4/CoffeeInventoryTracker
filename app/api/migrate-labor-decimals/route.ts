import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function POST() {
  try {
    console.log("🔧 Starting labor columns migration to DECIMAL...")

    // Alter the columns to support decimal values
    await accountsSql`
      ALTER TABLE labor_transactions 
        ALTER COLUMN hf_laborers TYPE DECIMAL(10,2),
        ALTER COLUMN outside_laborers TYPE DECIMAL(10,2)
    `

    console.log("✅ Labor columns migrated to DECIMAL successfully")

    return NextResponse.json({
      success: true,
      message: "Labor columns successfully migrated to support decimal values (e.g., 2.5 for half-day labor)",
    })
  } catch (error: any) {
    console.error("❌ Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Migration failed",
      },
      { status: 500 },
    )
  }
}
