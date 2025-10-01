import { NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"

export async function GET() {
  try {
    // Check if table exists and get its structure
    const tableCheck = await inventorySql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'current_inventory'
      ORDER BY ordinal_position
    `

    // Try to get sample data
    let sampleData = []
    try {
      sampleData = await inventorySql`
        SELECT * FROM current_inventory LIMIT 5
      `
    } catch (e) {
      sampleData = []
    }

    return NextResponse.json({
      success: true,
      tableExists: tableCheck.length > 0,
      columns: tableCheck,
      sampleData,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
