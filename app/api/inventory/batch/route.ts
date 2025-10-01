import { type NextRequest, NextResponse } from "next/server"
import {
  getAllTransactions,
  getAllInventoryItems,
  getLastUpdateTimestamp,
  initializeDefaultDataIfEmpty,
  checkIfDataExists,
} from "@/lib/storage"
import { checkRedisConnection } from "@/lib/redis"
import { performBatchOperation as neonPerformBatchOperation } from "@/lib/neon-inventory-storage"

// Lock to prevent concurrent updates
let isUpdating = false

// Flag to track if we've already checked for initialization
let hasCheckedForInitialization = false

export async function GET(request: NextRequest) {
  try {
    // Check Redis connection (just for status info)
    const redisConnected = await checkRedisConnection()

    // Very important: First check if ANY data exists
    const dataExists = await checkIfDataExists()

    // Only try to initialize if no data exists and we haven't checked yet
    if (!dataExists && !hasCheckedForInitialization) {
      console.log("No existing data found. Attempting to initialize with default data.")
      await initializeDefaultDataIfEmpty()
      hasCheckedForInitialization = true
    } else if (!hasCheckedForInitialization) {
      console.log("Existing data found. Skipping initialization.")
      hasCheckedForInitialization = true
    }

    // Get inventory and transactions
    const inventory = await getAllInventoryItems()
    const transactions = await getAllTransactions()
    const timestamp = await getLastUpdateTimestamp()

    return NextResponse.json({
      success: true,
      redis_connected: redisConnected,
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
  // If we're already updating, reject the request
  if (isUpdating) {
    return NextResponse.json(
      {
        success: false,
        error: "Another update is in progress",
      },
      { status: 409 },
    ) // 409 Conflict
  }

  try {
    // Set the updating flag
    isUpdating = true

    const body = await request.json()

    if (!Array.isArray(body.transactions)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected transactions array." },
        { status: 400 },
      )
    }

    const success = await neonPerformBatchOperation(body.transactions)

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
    // Clear the updating flag
    isUpdating = false
  }
}
