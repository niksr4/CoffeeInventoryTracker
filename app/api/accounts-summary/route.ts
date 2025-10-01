import { NextResponse } from "next/server"
import { getExpenditureSummary, getExpenditureSummaryByCode } from "@/lib/neon-accounts-storage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (code) {
      const summary = await getExpenditureSummaryByCode(code)
      return NextResponse.json({
        success: true,
        summary,
      })
    } else {
      const summaries = await getExpenditureSummary()
      return NextResponse.json({
        success: true,
        summaries,
        count: summaries.length,
      })
    }
  } catch (error: any) {
    console.error("Error in accounts-summary route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch expenditure summary",
        message: error?.message || String(error),
        summaries: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
