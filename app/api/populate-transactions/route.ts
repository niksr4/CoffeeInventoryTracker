import { NextResponse } from "next/server"
import { populateTransactionsForExistingInventory } from "@/lib/neon-inventory-storage"

export async function POST() {
  try {
    console.log("🔄 Starting transaction population...")

    const result = await populateTransactionsForExistingInventory()

    return NextResponse.json({
      success: true,
      message: result.skipped
        ? "Transactions already exist, no action taken"
        : `Successfully populated ${result.count} transactions`,
      result,
    })
  } catch (error: any) {
    console.error("❌ Error in populate-transactions route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to populate transactions",
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to populate transactions for existing inventory",
    instructions:
      "This endpoint creates initial transaction records for all items currently in the inventory database.",
  })
}
