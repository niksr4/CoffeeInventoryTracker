import { NextResponse } from "next/server"
import { neon } from "@neon/serverless"

const sql = neon(process.env.DISPATCH_DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get("fiscalYear")

    if (!fiscalYear) {
      return NextResponse.json(
        { success: false, error: "Fiscal year is required" },
        { status: 400 }
      )
    }

    const [startYear, endYear] = fiscalYear.split("/").map(Number)
    const startDate = `${startYear}-04-01`
    const endDate = `${endYear}-03-31`

    // Get dispatch records with kgs_received that are within the fiscal year
    const result = await sql`
      SELECT 
        d.*,
        COALESCE(SUM(s.bags_sold), 0) as total_bags_sold,
        d.bags_received - COALESCE(SUM(s.bags_sold), 0) as available_bags,
        d.kgs_received - COALESCE(SUM(s.bags_sold), 0) * 50 as available_kgs
      FROM dispatch_records d
      LEFT JOIN sales_records s ON d.id = s.dispatch_id
      WHERE d.dispatch_date >= ${startDate}::date 
        AND d.dispatch_date <= ${endDate}::date
        AND d.kgs_received IS NOT NULL
        AND d.kgs_received > 0
      GROUP BY d.id
      HAVING d.bags_received - COALESCE(SUM(s.bags_sold), 0) > 0
      ORDER BY d.dispatch_date DESC
    `

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Error fetching available dispatch records:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
