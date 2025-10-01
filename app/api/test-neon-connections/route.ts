import { NextResponse } from "next/server"
import { inventorySql, accountsSql } from "@/lib/neon-connections"

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    connections: {},
  }

  // Test inventory database
  try {
    console.log("🧪 Testing inventory_db connection...")
    const inventoryTables = await inventorySql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    results.connections.inventory_db = {
      status: "✅ Connected",
      tables: inventoryTables.map((t: any) => t.table_name),
      count: inventoryTables.length,
    }
    console.log(`✅ inventory_db: ${inventoryTables.length} tables found`)
  } catch (error: any) {
    results.connections.inventory_db = {
      status: "❌ Failed",
      error: error?.message || String(error),
    }
    console.error("❌ inventory_db connection failed:", error?.message)
  }

  // Test accounts database
  try {
    console.log("🧪 Testing accounts_db connection...")
    const accountsTables = await accountsSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    results.connections.accounts_db = {
      status: "✅ Connected",
      tables: accountsTables.map((t: any) => t.table_name),
      count: accountsTables.length,
    }
    console.log(`✅ accounts_db: ${accountsTables.length} tables found`)
  } catch (error: any) {
    results.connections.accounts_db = {
      status: "❌ Failed",
      error: error?.message || String(error),
    }
    console.error("❌ accounts_db connection failed:", error?.message)
  }

  // Sample data from inventory
  try {
    const sampleInventory = await inventorySql`
      SELECT item_type, quantity, unit 
      FROM current_inventory 
      LIMIT 5
    `
    results.connections.inventory_db.sample_data = sampleInventory
  } catch (error: any) {
    console.error("❌ Error fetching sample inventory:", error?.message)
  }

  return NextResponse.json(results, { status: 200 })
}
