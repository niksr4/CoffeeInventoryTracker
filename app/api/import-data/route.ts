import { NextResponse } from "next/server"
import { bulkImportTransactions, bulkImportConsumables, initializeTables } from "@/lib/neon-storage"

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json()

    // Initialize tables if they don't exist
    await initializeTables()

    if (type === "transactions") {
      const result = await bulkImportTransactions(data)
      return NextResponse.json({
        success: result.success,
        message: `Imported ${result.imported} inventory transactions`,
        imported: result.imported,
      })
    } else if (type === "consumables") {
      const result = await bulkImportConsumables(data)
      return NextResponse.json({
        success: result.success,
        message: `Imported ${result.imported} consumable deployments`,
        imported: result.imported,
      })
    } else {
      return NextResponse.json({ success: false, error: "Invalid import type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
