import { type NextRequest, NextResponse } from "next/server"
import {
  getAllTransactions,
  getAllInventoryItems,
  getLastUpdateTimestamp,
  initializeDefaultDataIfEmpty,
  checkIfDataExists,
  performBatchOperation,
} from "@/lib/neon-inventory-storage"

let isUpdating = false
let hasCheckedForInitialization = false

export async function GET(request: NextRequest) {
  try {
    const dataExists = await checkIfDataExists()

    if (!dataExists && !hasCheckedForInitialization) {
      console.log("No existing data found. Attempting to initialize with default data.")
      await initializeDefaultDataIfEmpty()
      hasCheckedForInitialization = true
    } else if (!hasCheckedForInitialization) {
      console.log("Existing data found. Skipping initialization.")
      hasCheckedForInitialization = true
    }

    const inventory = await getAllInventoryItems()
    const transactions = await getAllTransactions()
    const timestamp = await getLastUpdateTimestamp()

    return NextResponse.json({
      success: true,
      storage: "neon",
      inventory,
      transactions,
      timestamp,
      has_existing_data: dataExists,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  if (isUpdating) {
    return NextResponse.json(
      {
        success: false,
        error: "Another update is in progress",
      },
      { status: 409 },
    )
  }

  try {
    isUpdating = true

    const body = await request.json()

    if (!Array.isArray(body.transactions)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected transactions array." },
        { status: 400 },
      )
    }

    const success = await performBatchOperation(body.transactions)

    if (success) {
      const inventory = await getAllInventoryItems()
      const transactions = await getAllTransactions()
      const newTimestamp = await getLastUpdateTimestamp()

      return NextResponse.json({
        success: true,
        inventory,
        transactions,
        timestamp: newTimestamp,
      })
    } else {
      return NextResponse.json({ success: false, error: "Failed to perform batch operation" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in batch operation:", error)
    return NextResponse.json({ success: false, error: "Failed to perform batch operation" }, { status: 500 })
  } finally {
    isUpdating = false
  }
}
