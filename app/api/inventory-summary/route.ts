import { NextResponse } from "next/server"
import { getInventorySummary } from "@/lib/neon-inventory-storage"

export async function GET() {
  try {
    const summary = await getInventorySummary()

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error("Error fetching inventory summary:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
