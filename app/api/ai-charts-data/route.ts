import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getFiscalYearDateRange, getCurrentFiscalYear } from "@/lib/fiscal-year-utils"

// Database connections
const getAccountsDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/?]+(\?|$)/, "/accounts_db$1"))
const getProcessingDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/?]+(\?|$)/, "/processing_db$1"))

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fiscalYearStart = searchParams.get("fiscalYearStart")
    const fiscalYearEnd = searchParams.get("fiscalYearEnd")

    // Use current fiscal year if not specified
    const fiscalYear = getCurrentFiscalYear()
    const { startDate, endDate } = getFiscalYearDateRange(fiscalYear)
    const start = fiscalYearStart || startDate
    const end = fiscalYearEnd || endDate

    // Fetch labor data
    let laborData: any[] = []
    try {
      const sql = getAccountsDb()
      laborData = await sql`
        SELECT 
          deployment_date,
          hf_laborers,
          hf_cost_per_laborer,
          outside_laborers,
          outside_cost_per_laborer,
          total_cost,
          code
        FROM labor_transactions
        WHERE deployment_date >= ${start} AND deployment_date <= ${end}
        ORDER BY deployment_date DESC
      `
    } catch (error) {
      console.error("Error fetching labor data:", error)
    }

    // Fetch processing data from all locations
    const processingData: Record<string, any[]> = {}
    const locations = ["hf_arabica", "hf_robusta", "mv_robusta", "pg_robusta"]
    const locationLabels: Record<string, string> = {
      "hf_arabica": "HF Arabica",
      "hf_robusta": "HF Robusta",
      "mv_robusta": "MV Robusta",
      "pg_robusta": "PG Robusta"
    }

    try {
      const sql = getProcessingDb()
      for (const location of locations) {
        try {
          const result = await sql`
            SELECT 
              process_date,
              crop_today,
              ripe_today,
              dry_p_today,
              dry_cherry_today,
              dry_p_bags,
              dry_cherry_bags,
              dry_p_bags_todate,
              dry_cherry_bags_todate
            FROM ${sql(location)}
            WHERE process_date >= ${start} AND process_date <= ${end}
            ORDER BY process_date DESC
          `
          processingData[locationLabels[location]] = result
        } catch (error) {
          console.error(`Error fetching ${location} processing data:`, error)
          processingData[locationLabels[location]] = []
        }
      }
    } catch (error) {
      console.error("Error fetching processing data:", error)
    }

    return NextResponse.json({
      success: true,
      laborData,
      processingData
    })
  } catch (error) {
    console.error("AI Charts data error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
