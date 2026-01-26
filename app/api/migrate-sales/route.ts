import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

// Connect to dispatch database
function getDispatchDb() {
  const baseUrl = process.env.DATABASE_URL || ""
  const dispatchUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, "/dispatch$1")
  return neon(dispatchUrl)
}

export async function POST() {
  try {
    const sql = getDispatchDb()
    
    // Add bags_sent column
    await sql`
      ALTER TABLE sales_records 
      ADD COLUMN IF NOT EXISTS bags_sent INTEGER DEFAULT 0
    `
    
    // Add kgs_sent column
    await sql`
      ALTER TABLE sales_records 
      ADD COLUMN IF NOT EXISTS kgs_sent DECIMAL(10,2) DEFAULT 0
    `
    
    // Add kgs_received column
    await sql`
      ALTER TABLE sales_records 
      ADD COLUMN IF NOT EXISTS kgs_received DECIMAL(10,2) DEFAULT 0
    `
    
    // Migrate existing data from weight_kgs to new columns
    await sql`
      UPDATE sales_records 
      SET kgs_received = COALESCE(weight_kgs, 0),
          bags_sent = CEIL(COALESCE(weight_kgs, 0) / 50),
          kgs_sent = CEIL(COALESCE(weight_kgs, 0) / 50) * 50
      WHERE (kgs_received = 0 OR kgs_received IS NULL) AND weight_kgs IS NOT NULL
    `

    return NextResponse.json({ 
      success: true, 
      message: "Migration completed successfully. Added bags_sent, kgs_sent, and kgs_received columns." 
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST to this endpoint to run the sales table migration" 
  })
}
