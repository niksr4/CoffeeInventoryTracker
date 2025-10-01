import { NextResponse } from "next/server"
import { testConnection, createTables } from "@/lib/neon"

export async function GET() {
  try {
    // Test connection
    const connectionTest = await testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: "Connection failed: " + connectionTest.error,
      })
    }

    // Create tables
    const tablesResult = await createTables()
    if (!tablesResult.success) {
      return NextResponse.json({
        success: false,
        error: "Table creation failed: " + tablesResult.error,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Neon connection successful and tables are ready",
      connectionTime: connectionTest.data,
    })
  } catch (error) {
    console.error("Test Neon error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
