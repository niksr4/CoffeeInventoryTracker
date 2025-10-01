import { NextResponse } from "next/server"
import { inventorySql, accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("🔍 Inspecting all databases...")

    // Get inventory_db information
    const inventoryInfo = await inventorySql`
      SELECT 
        current_database() as database_name,
        schemaname as schema_name,
        tablename as table_name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    // Get detailed column information for inventory_db
    const inventoryColumns = await inventorySql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Get accounts_db information
    const accountsInfo = await accountsSql`
      SELECT 
        current_database() as database_name,
        schemaname as schema_name,
        tablename as table_name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    // Get detailed column information for accounts_db
    const accountsColumns = await accountsSql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Format the results
    const inventoryTables = Array.from(new Set(inventoryInfo.map((row) => row.table_name)))
    const accountsTables = Array.from(new Set(accountsInfo.map((row) => row.table_name)))

    const inventorySchema: Record<string, any[]> = {}
    inventoryColumns.forEach((col: any) => {
      if (!inventorySchema[col.table_name]) {
        inventorySchema[col.table_name] = []
      }
      inventorySchema[col.table_name].push({
        column: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default: col.column_default,
      })
    })

    const accountsSchema: Record<string, any[]> = {}
    accountsColumns.forEach((col: any) => {
      if (!accountsSchema[col.table_name]) {
        accountsSchema[col.table_name] = []
      }
      accountsSchema[col.table_name].push({
        column: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default: col.column_default,
      })
    })

    const result = {
      success: true,
      databases: {
        inventory_db: {
          database_name: inventoryInfo[0]?.database_name || "inventory_db",
          tables: inventoryTables,
          schema: inventorySchema,
          table_count: inventoryTables.length,
        },
        accounts_db: {
          database_name: accountsInfo[0]?.database_name || "accounts_db",
          tables: accountsTables,
          schema: accountsSchema,
          table_count: accountsTables.length,
        },
      },
    }

    console.log("✅ Database inspection complete")
    console.log("\n📊 INVENTORY_DB:")
    console.log("Tables:", inventoryTables)
    console.log("\n📊 ACCOUNTS_DB:")
    console.log("Tables:", accountsTables)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("❌ Error inspecting databases:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
