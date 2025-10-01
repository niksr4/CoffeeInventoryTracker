import { NextResponse } from "next/server"
import { inventorySql, accountsSql, testConnections } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("🔍 Checking database connections and tables...")

    // Test connections first
    const connectionTest = await testConnections()

    // Check inventory_db tables
    const inventoryTables = await inventorySql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Check accounts_db tables
    const accountsTables = await accountsSql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Group by table
    const inventoryTablesByName: Record<string, any[]> = {}
    for (const row of inventoryTables) {
      if (!inventoryTablesByName[row.table_name]) {
        inventoryTablesByName[row.table_name] = []
      }
      inventoryTablesByName[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
      })
    }

    const accountsTablesByName: Record<string, any[]> = {}
    for (const row of accountsTables) {
      if (!accountsTablesByName[row.table_name]) {
        accountsTablesByName[row.table_name] = []
      }
      accountsTablesByName[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
      })
    }

    return NextResponse.json({
      success: true,
      connections: connectionTest,
      inventory_db: {
        tables: Object.keys(inventoryTablesByName),
        schema: inventoryTablesByName,
      },
      accounts_db: {
        tables: Object.keys(accountsTablesByName),
        schema: accountsTablesByName,
      },
    })
  } catch (error) {
    console.error("❌ Error checking tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
