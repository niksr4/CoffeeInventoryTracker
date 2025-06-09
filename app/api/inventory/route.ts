import { type NextRequest, NextResponse } from "next/server"

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
  // Removed "Diesel" entry as H.S.D is the replacement
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
  const searchParams = new URL(request.url).searchParams
  const type = searchParams.get("type")

  if (type === "items") {
    return NextResponse.json({ items: globalInventoryItems, lastUpdate: lastUpdateTimestamp })
  } else if (type === "transactions") {
    return NextResponse.json({ transactions: globalInventoryTransactions, lastUpdate: lastUpdateTimestamp })
  } else {
    return NextResponse.json({
      items: globalInventoryItems,
      transactions: globalInventoryTransactions,
      lastUpdate: lastUpdateTimestamp,
    })
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
