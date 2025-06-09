import { NextResponse } from "next/server"
import { getAllTransactions, getAllInventoryItems } from "@/lib/storage"

export async function GET() {
  try {
    console.log("=== DEBUG DATA FETCH ===")

    // Get transactions and inventory
    const transactions = await getAllTransactions()
    const inventory = await getAllInventoryItems()

    console.log("Transactions count:", transactions.length)
    console.log("Inventory count:", inventory.length)

    // Log first few transactions for debugging
    if (transactions.length > 0) {
      console.log("First transaction:", JSON.stringify(transactions[0], null, 2))
      console.log("Last transaction:", JSON.stringify(transactions[transactions.length - 1], null, 2))
    }

    // Log first few inventory items
    if (inventory.length > 0) {
      console.log("First inventory item:", JSON.stringify(inventory[0], null, 2))
    }

    return NextResponse.json({
      success: true,
      debug: {
        transactionsCount: transactions.length,
        inventoryCount: inventory.length,
        firstTransaction: transactions[0] || null,
        lastTransaction: transactions[transactions.length - 1] || null,
        firstInventoryItem: inventory[0] || null,
        sampleTransactions: transactions.slice(0, 3),
        sampleInventory: inventory.slice(0, 3),
      },
      transactions,
      inventory,
    })
  } catch (error) {
    console.error("Debug data fetch error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
