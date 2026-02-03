import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get dispatch records that have kgs_received and calculate how much has been sold
    const dispatches = await sql`
      SELECT 
        d.*,
        COALESCE(SUM(s.bags_sold), 0) as total_sold,
        (d.bags_received - COALESCE(SUM(s.bags_sold), 0)) as available_bags
      FROM dispatch_records d
      LEFT JOIN sales_records s ON s.dispatch_id = d.id
      WHERE d.kgs_received IS NOT NULL AND d.kgs_received > 0
      GROUP BY d.id
      HAVING (d.bags_received - COALESCE(SUM(s.bags_sold), 0)) > 0
      ORDER BY d.dispatch_date DESC
    `

    return NextResponse.json({ success: true, dispatches })
  } catch (error: any) {
    console.error("Error fetching available dispatches:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
