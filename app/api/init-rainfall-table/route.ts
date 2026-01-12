import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    const rainfallDbUrl = process.env.DATABASE_URL!.replace(/\/[^/]+$/, "/Rainfall")
    const sql = neon(rainfallDbUrl)

    const scriptPath = join(process.cwd(), "scripts", "13-create-rainfall-table.sql")
    const sqlScript = readFileSync(scriptPath, "utf-8")

    // Split statements and execute them
    const statements = sqlScript
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      await sql([statement] as any)
    }

    return NextResponse.json({
      success: true,
      message: "Rainfall table initialized successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error initializing rainfall table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
