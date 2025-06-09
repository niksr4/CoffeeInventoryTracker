import { NextResponse } from "next/server"
import { getAllTransactions, getAllInventoryItems, checkIfDataExists } from "@/lib/storage"
import { redis, KEYS } from "@/lib/redis"

export async function GET() {
  try {
    console.log("=== TRANSACTION DEBUG ===")

    // Check if data exists
    const dataExists = await checkIfDataExists()
    console.log("Data exists:", dataExists)

    // Get transactions from storage
    const transactions = await getAllTransactions()
    console.log("Transactions from storage:", transactions.length)

    // Get inventory from storage
    const inventory = await getAllInventoryItems()
    console.log("Inventory from storage:", inventory.length)

    // Check Redis directly if available
    let redisTransactions = null
    let redisInventoryHash = null

    if (redis) {
      try {
        redisTransactions = await redis.get(KEYS.TRANSACTIONS)
        redisInventoryHash = await redis.hgetall(KEYS.INVENTORY_HASH)
        console.log("Redis transactions:", redisTransactions ? redisTransactions.length : "null")
        console.log("Redis inventory hash keys:", redisInventoryHash ? Object.keys(redisInventoryHash).length : "null")
      } catch (error) {
        console.error("Redis direct check error:", error)
      }
    }

    // Check localStorage (client-side will be null on server)
    let localStorageInfo = "Server-side (not available)"
    if (typeof window !== "undefined") {
      try {
        const localTransactions = localStorage.getItem("inventoryTransactions")
        localStorageInfo = localTransactions ? `${JSON.parse(localTransactions).length} transactions` : "null"
      } catch (error) {
        localStorageInfo = "Error reading localStorage"
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        dataExists,
        storageTransactions: transactions.length,
        storageInventory: inventory.length,
        redisTransactions: redisTransactions ? redisTransactions.length : "null",
        redisInventoryHashKeys: redisInventoryHash ? Object.keys(redisInventoryHash).length : "null",
        localStorage: localStorageInfo,
        sampleTransactions: transactions.slice(0, 3),
        sampleInventory: inventory.slice(0, 3),
      },
      transactions,
      inventory,
    })
  } catch (error) {
    console.error("Transaction debug error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
