import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"
import { readFileSync } from "fs"
import { join } from "path"

export async function POST() {
  try {
    console.log("🚀 Initializing accounts_db...")

    // Read the SQL script
    const sqlPath = join(process.cwd(), "scripts", "08-create-accounts-tables.sql")
    const sqlScript = readFileSync(sqlPath, "utf-8")

    // Split by semicolons and filter out empty statements
    const statements = sqlScript
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      await accountsSql([statement])
    }

    console.log("✅ Accounts database initialized successfully!")

    return NextResponse.json({
      success: true,
      message: "Accounts database initialized successfully",
    })
  } catch (error) {
    console.error("❌ Error initializing accounts database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
