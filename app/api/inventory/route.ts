import { type NextRequest, NextResponse } from "next/server"
import { getAllInventoryItems } from "@/lib/neon-inventory-storage"

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
  { name: "Rock phosphate", quantity: 0, unit: "kg" },
  { name: "Micromin", quantity: 0, unit: "kg" },
  { name: "Fix", quantity: 0, unit: "L" },
  { name: "Gramaxone", quantity: 0, unit: "L" },
  { name: "Polyhalite", quantity: 0, unit: "kg" },
]

// In-memory storage (in a real app, you'd use a database)
// Use global variables to persist data between API calls and deployments
let globalInventoryItems: any[] = []
let globalInventoryTransactions: any[] = []
let lastUpdateTimestamp = Date.now() // Track when data was last updated

// Initialize with default values only if empty
if (globalInventoryItems.length === 0) {
  globalInventoryItems = [...defaultInventoryItems]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeZero = searchParams.get("includeZero") !== "false"

    const items = await getAllInventoryItems(includeZero)

    return NextResponse.json({
      items,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ items: [], error: "Failed to fetch inventory data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, data, timestamp } = body

  // Always update if we don't have a timestamp comparison
  // or if the incoming data is newer
  const shouldUpdate = !timestamp || !lastUpdateTimestamp || timestamp >= lastUpdateTimestamp

  if (shouldUpdate) {
    if (type === "items") {
      globalInventoryItems = data
      lastUpdateTimestamp = timestamp || Date.now()

      // Log successful update for debugging
      console.log(`API: Updated inventory items at ${new Date(lastUpdateTimestamp).toISOString()}`)

      return NextResponse.json({
        success: true,
        items: globalInventoryItems,
        lastUpdate: lastUpdateTimestamp,
      })
    } else if (type === "transactions") {
      globalInventoryTransactions = data
      lastUpdateTimestamp = timestamp || Date.now()

      // Log successful update for debugging
      console.log(`API: Updated transactions at ${new Date(lastUpdateTimestamp).toISOString()}`)

      return NextResponse.json({
        success: true,
        transactions: globalInventoryTransactions,
        lastUpdate: lastUpdateTimestamp,
      })
    } else {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 })
    }
  } else {
    // If the incoming data is older, return the current data without updating
    console.log(
      `API: Rejected older data from ${new Date(timestamp).toISOString()}, current data from ${new Date(lastUpdateTimestamp).toISOString()}`,
    )

    if (type === "items") {
      return NextResponse.json({
        success: false,
        message: "Rejected older data",
        items: globalInventoryItems,
        lastUpdate: lastUpdateTimestamp,
      })
    } else if (type === "transactions") {
      return NextResponse.json({
        success: false,
        message: "Rejected older data",
        transactions: globalInventoryTransactions,
        lastUpdate: lastUpdateTimestamp,
      })
    } else {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 })
    }
  }
}
