import { NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), "scripts", "12-create-location-tables.sql")
    const sql = fs.readFileSync(sqlPath, "utf-8")

    console.log("Executing SQL migration...")

    // Execute the SQL
    await processingSql.query(sql, [])

    console.log("Migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Location tables created successfully",
    })
  } catch (error: any) {
    console.error("Error creating location tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check which tables exist and their record counts
    const tables = ["hf_arabica", "hf_robusta", "mv_robusta", "pg_robusta"]
    const status: any = {}

    for (const table of tables) {
      try {
        const result = await processingSql.query(`SELECT COUNT(*) as count FROM ${table}`, [])
        status[table] = {
          exists: true,
          count: Number.parseInt(result.rows[0].count),
        }
      } catch (error) {
        status[table] = {
          exists: false,
          count: 0,
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: status,
    })
  } catch (error: any) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
