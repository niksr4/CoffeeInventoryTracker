import { NextResponse } from "next/server"
import { inventorySql, accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    // Test both database connections
    const inventoryTest = await inventorySql`SELECT 1 as test`
    const accountsTest = await accountsSql`SELECT 1 as test`

    return NextResponse.json({
      status: "operational",
      storage: "neon",
      databases: {
        inventory: inventoryTest.length > 0 ? "connected" : "error",
        accounts: accountsTest.length > 0 ? "connected" : "error",
      },
      message: "Using Neon PostgreSQL databases",
    })
  } catch (error) {
    console.error("Storage status check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        storage: "neon",
        databases: {
          inventory: "error",
          accounts: "error",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
