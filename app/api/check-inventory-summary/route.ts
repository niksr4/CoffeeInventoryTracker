import { NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("🔍 Checking inventory_summary table...")

    // Check if table exists
    const tableCheck = await inventorySql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory_summary'
      ) as table_exists
    `

    console.log("Table exists check:", tableCheck)

    // Try to query the summary
    const summary = await inventorySql`
      SELECT * FROM inventory_summary
    `

    console.log("Summary data:", summary)

    // Also check current_inventory for comparison
    const inventory = await inventorySql`
      SELECT COUNT(*) as count FROM current_inventory
    `

    console.log("Current inventory count:", inventory)

    return NextResponse.json({
      success: true,
      tableExists: tableCheck[0]?.table_exists,
      summaryData: summary,
      inventoryCount: inventory[0]?.count,
    })
  } catch (error: any) {
    console.error("❌ Error checking inventory_summary:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
