import { NextResponse } from "next/server"
import { redis, KEYS } from "@/lib/redis"
import { performBatchOperation } from "@/lib/inventory-service"
import type { Transaction, InventoryItem } from "@/lib/inventory-service"

// Default inventory items to use if no data is found
const defaultInventoryItems = [
  { name: "UREA", quantity: 7130, unit: "kg" },
  { name: "MOP", quantity: 3050, unit: "kg" },
  { name: "DAP", quantity: 3350, unit: "kg" },
  { name: "MOP white", quantity: 13200, unit: "kg" },
  { name: "MgSO4", quantity: 3475, unit: "kg" },
  { name: "MOP+UREA Mix", quantity: 12, unit: "bags" },
  { name: "Phosphoric Acid", quantity: 50, unit: "L" },
  { name: "Tricel", quantity: 35, unit: "L" },
  { name: "Glycil", quantity: 120, unit: "L" },
  { name: "Neem oil", quantity: 5, unit: "L" },
  { name: "19:19:19", quantity: 200, unit: "kg" },
  { name: "Zinc", quantity: 10, unit: "L" },
  { name: "Contaf", quantity: 20, unit: "L" },
  { name: "NPK Potassium Nitrate", quantity: 50, unit: "kg" },
  { name: "Solubor", quantity: 2, unit: "kg" },
  { name: "H.S.D", quantity: 20, unit: "L" },
  { name: "Petrol", quantity: 25, unit: "L" },
]

export async function GET(request: Request) {
  try {
    // Check if Redis already has data
    const existingTransactions = await redis.get<Transaction[]>(KEYS.TRANSACTIONS)

    if (existingTransactions && existingTransactions.length > 0) {
      return NextResponse.json({
        success: false,
        message:
          "Migration skipped: Data already exists in Redis. To force migration, use POST request with force=true.",
        existingCount: existingTransactions.length,
      })
    }

    // Get source data from query parameters or use defaults
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source") || "default"

    // Generate initial transactions based on source
    const initialTransactions = await generateInitialTransactions(source)

    // Perform the migration
    const success = await performBatchOperation(initialTransactions)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Data successfully migrated to Redis",
        transactionsCount: initialTransactions.length,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to migrate data to Redis",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error during migration",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { force = false, source = "default" } = body

    // Check if Redis already has data and we're not forcing
    if (!force) {
      const existingTransactions = await redis.get<Transaction[]>(KEYS.TRANSACTIONS)
      if (existingTransactions && existingTransactions.length > 0) {
        return NextResponse.json({
          success: false,
          message: "Migration skipped: Data already exists in Redis. Set force=true to override.",
          existingCount: existingTransactions.length,
        })
      }
    }

    // If forcing, clear existing data
    if (force) {
      await redis.del(KEYS.TRANSACTIONS)
      await redis.del(KEYS.INVENTORY_HASH)
      await redis.del(KEYS.LAST_UPDATE)
    }

    // Generate initial transactions based on source
    const initialTransactions = await generateInitialTransactions(source)

    // Perform the migration
    const success = await performBatchOperation(initialTransactions)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Data successfully migrated to Redis",
        transactionsCount: initialTransactions.length,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to migrate data to Redis",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error during migration",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to generate initial transactions based on source
async function generateInitialTransactions(source: string): Promise<Transaction[]> {
  // Get current timestamp
  const timestamp = new Date().toISOString()

  // Initialize transactions array
  let transactions: Transaction[] = []

  if (source === "api") {
    // Fetch data from the old API route
    try {
      const response = await fetch("http://localhost:3000/api/inventory")
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const items = data.items || []

      // Convert items to initial transactions
      transactions = items.map((item: InventoryItem) => ({
        id: `init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        itemType: item.name,
        quantity: item.quantity,
        transactionType: "Restocking",
        notes: "Initial migration from API",
        date: timestamp,
        user: "system",
        unit: item.unit,
      }))
    } catch (error) {
      console.error("Error fetching from API:", error)
      // Fall back to default items
      return generateDefaultTransactions(timestamp)
    }
  } else {
    // Use default items
    return generateDefaultTransactions(timestamp)
  }

  return transactions
}

// Helper function to generate transactions from default items
function generateDefaultTransactions(timestamp: string): Transaction[] {
  return defaultInventoryItems.map((item) => ({
    id: `init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    itemType: item.name,
    quantity: item.quantity,
    transactionType: "Restocking",
    notes: "Initial system setup",
    date: timestamp,
    user: "system",
    unit: item.unit,
  }))
}
