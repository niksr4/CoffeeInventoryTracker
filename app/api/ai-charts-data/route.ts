import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getFiscalYearDateRange, getCurrentFiscalYear } from "@/lib/fiscal-year-utils"

// Database connections
const getAccountsDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/?]+(\?|$)/, "/accounts_db$1"))
const getProcessingDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/?]+(\?|$)/, "/processing_db$1"))

// Helper functions to fetch from each processing table
async function fetchHfArabica(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, dry_p_today, dry_cherry_today, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM hf_arabica WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC`
}

async function fetchHfRobusta(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, dry_p_today, dry_cherry_today, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM hf_robusta WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC`
}

async function fetchMvRobusta(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, dry_p_today, dry_cherry_today, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM mv_robusta WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC`
}

async function fetchPgRobusta(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, dry_p_today, dry_cherry_today, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM pg_robusta WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC`
}

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
    let laborData: unknown[] = []
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
        WHERE deployment_date >= ${start}::date AND deployment_date <= ${end}::date
        ORDER BY deployment_date DESC
      `
    } catch (error) {
      console.error("Error fetching labor data:", error)
    }

    // Fetch processing data from all locations in parallel
    const processingData: Record<string, unknown[]> = {
      "HF Arabica": [],
      "HF Robusta": [],
      "MV Robusta": [],
      "PG Robusta": []
    }

    try {
      const [hfArabica, hfRobusta, mvRobusta, pgRobusta] = await Promise.all([
        fetchHfArabica(start, end).catch(() => []),
        fetchHfRobusta(start, end).catch(() => []),
        fetchMvRobusta(start, end).catch(() => []),
        fetchPgRobusta(start, end).catch(() => [])
      ])
      
      processingData["HF Arabica"] = hfArabica
      processingData["HF Robusta"] = hfRobusta
      processingData["MV Robusta"] = mvRobusta
      processingData["PG Robusta"] = pgRobusta
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
