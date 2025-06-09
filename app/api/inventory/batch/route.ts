import { type NextRequest, NextResponse } from "next/server"
import {
  getAllTransactions,
  getAllInventoryItems,
  performBatchOperation,
  getLastUpdateTimestamp,
  addTransaction,
  initializeDefaultDataIfEmpty,
  checkIfDataExists,
} from "@/lib/storage"
import { checkRedisConnection } from "@/lib/redis"

// Lock to prevent concurrent updates
let isUpdating = false

// Flag to track if we've already checked for initialization
let hasCheckedForInitialization = false

export async function GET(request: NextRequest) {
  try {
    console.log("=== Batch API GET called ===")

    // Check Redis connection (just for status info)
    const redisConnected = await checkRedisConnection()
    console.log("Redis connected:", redisConnected)

    // Very important: First check if ANY data exists
    const dataExists = await checkIfDataExists()
    console.log("Data exists:", dataExists)

    // Only try to initialize if no data exists and we haven't checked yet
    if (!dataExists && !hasCheckedForInitialization) {
      console.log("No existing data found. Attempting to initialize with default data.")
      const initResult = await initializeDefaultDataIfEmpty()
      console.log("Initialization result:", initResult)
      hasCheckedForInitialization = true
    } else if (!hasCheckedForInitialization) {
      console.log("Existing data found. Skipping initialization.")
      hasCheckedForInitialization = true
    }

    // Get inventory and transactions
    console.log("Getting inventory and transactions...")
    const inventory = await getAllInventoryItems()
    const transactions = await getAllTransactions()
    const timestamp = await getLastUpdateTimestamp()

    console.log("Final data:", {
      inventoryCount: inventory.length,
      transactionsCount: transactions.length,
      timestamp: new Date(timestamp).toISOString(),
    })

    return NextResponse.json({
      success: true,
      redis_connected: redisConnected,
      inventory,
      transactions,
      timestamp,
      has_existing_data: dataExists,
      debug: {
        inventoryCount: inventory.length,
        transactionsCount: transactions.length,
        dataExisted: dataExists,
        hasCheckedInit: hasCheckedForInitialization,
      },
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
    const { operation, data, timestamp } = body

    console.log("=== Batch API POST called ===", { operation, timestamp })

    // Get current timestamp
    const currentTimestamp = await getLastUpdateTimestamp()

    // Always update if we don't have a timestamp comparison
    // or if the incoming data is newer
    const shouldUpdate = !timestamp || !currentTimestamp || timestamp >= currentTimestamp

    if (!shouldUpdate) {
      // If the incoming data is older, return the current data without updating
      console.log(
        `API: Rejected older data from ${new Date(timestamp).toISOString()}, current data from ${new Date(currentTimestamp).toISOString()}`,
      )

      const inventory = await getAllInventoryItems()
      const transactions = await getAllTransactions()

      return NextResponse.json({
        success: false,
        message: "Rejected older data",
        inventory,
        transactions,
        timestamp: currentTimestamp,
      })
    }

    // Handle different operations
    if (operation === "addTransaction" && data.transaction) {
      // Add a single transaction
      console.log("Adding single transaction:", data.transaction)
      const success = await addTransaction(data.transaction)

      if (success) {
        const inventory = await getAllInventoryItems()
        const transactions = await getAllTransactions()
        const newTimestamp = await getLastUpdateTimestamp()

        console.log("Transaction added successfully:", {
          inventoryCount: inventory.length,
          transactionsCount: transactions.length,
        })

        return NextResponse.json({
          success: true,
          inventory,
          transactions,
          timestamp: newTimestamp,
        })
      } else {
        return NextResponse.json({ success: false, error: "Failed to add transaction" }, { status: 500 })
      }
    } else if (operation === "batchUpdate" && data.transactions) {
      // Perform batch update
      console.log("Performing batch update with", data.transactions.length, "transactions")
      const success = await performBatchOperation(data.transactions)

      if (success) {
        const inventory = await getAllInventoryItems()
        const transactions = await getAllTransactions()
        const newTimestamp = await getLastUpdateTimestamp()

        console.log("Batch update successful:", {
          inventoryCount: inventory.length,
          transactionsCount: transactions.length,
        })

        return NextResponse.json({
          success: true,
          inventory,
          transactions,
          timestamp: newTimestamp,
        })
      } else {
        return NextResponse.json({ success: false, error: "Failed to perform batch update" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  } finally {
    // Clear the updating flag
    isUpdating = false
  }
}
