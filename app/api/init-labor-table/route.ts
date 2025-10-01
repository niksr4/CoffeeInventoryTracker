import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    console.log("[SERVER] 📥 Initializing labor_deployments table...")

    // Read the SQL script
    const sqlPath = join(process.cwd(), "scripts", "06-create-labor-deployments.sql")
    const sql = readFileSync(sqlPath, "utf-8")

    // Execute the SQL
    await accountsSql.unsafe(sql)

    console.log("[SERVER] ✅ Labor deployments table initialized successfully")

    return NextResponse.json({
      success: true,
      message: "Labor deployments table initialized successfully",
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error initializing labor table:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize labor table",
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}
