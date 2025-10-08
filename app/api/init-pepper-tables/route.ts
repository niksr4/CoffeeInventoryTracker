import { NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    // Check if tables exist
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pg_pepper', 'hf_pepper', 'mv_pepper')
    `
    const result = await processingSql.query(checkQuery, [])
    const existingTables = result.rows || []

    const tableStatus = {
      pg_pepper: existingTables.some((t: any) => t.table_name === "pg_pepper"),
      hf_pepper: existingTables.some((t: any) => t.table_name === "hf_pepper"),
      mv_pepper: existingTables.some((t: any) => t.table_name === "mv_pepper"),
    }

    return NextResponse.json({
      success: true,
      tables: tableStatus,
      allTablesExist: Object.values(tableStatus).every((exists) => exists),
    })
  } catch (error: any) {
    console.error("Error checking pepper tables:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("Creating pepper tables in processing_db...")

    // Create pg_pepper table
    await processingSql.query(
      `
      CREATE TABLE IF NOT EXISTS pg_pepper (
        id SERIAL PRIMARY KEY,
        process_date DATE NOT NULL UNIQUE,
        kg_picked DECIMAL(10, 2) NOT NULL DEFAULT 0,
        green_pepper DECIMAL(10, 2) NOT NULL DEFAULT 0,
        green_pepper_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        dry_pepper DECIMAL(10, 2) NOT NULL DEFAULT 0,
        dry_pepper_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        recorded_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create hf_pepper table
    await processingSql.query(
      `
      CREATE TABLE IF NOT EXISTS hf_pepper (
        id SERIAL PRIMARY KEY,
        process_date DATE NOT NULL UNIQUE,
        kg_picked DECIMAL(10, 2) NOT NULL DEFAULT 0,
        green_pepper DECIMAL(10, 2) NOT NULL DEFAULT 0,
        green_pepper_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        dry_pepper DECIMAL(10, 2) NOT NULL DEFAULT 0,
        dry_pepper_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        recorded_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create mv_pepper table
    await processingSql.query(
      `
      CREATE TABLE IF NOT EXISTS mv_pepper (
        id SERIAL PRIMARY KEY,
        process_date DATE NOT NULL UNIQUE,
        kg_picked DECIMAL(10, 2) NOT NULL DEFAULT 0,
        green_pepper DECIMAL(10, 2) NOT NULL DEFAULT 0,
        green_pepper_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        dry_pepper DECIMAL(10, 2) NOT NULL DEFAULT 0,
        dry_pepper_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        recorded_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
    )

    // Create indexes
    await processingSql.query(`CREATE INDEX IF NOT EXISTS idx_pg_pepper_date ON pg_pepper(process_date DESC)`, [])
    await processingSql.query(`CREATE INDEX IF NOT EXISTS idx_hf_pepper_date ON hf_pepper(process_date DESC)`, [])
    await processingSql.query(`CREATE INDEX IF NOT EXISTS idx_mv_pepper_date ON mv_pepper(process_date DESC)`, [])

    await processingSql.query(`CREATE INDEX IF NOT EXISTS idx_pg_pepper_created ON pg_pepper(created_at DESC)`, [])
    await processingSql.query(`CREATE INDEX IF NOT EXISTS idx_hf_pepper_created ON hf_pepper(created_at DESC)`, [])
    await processingSql.query(`CREATE INDEX IF NOT EXISTS idx_mv_pepper_created ON mv_pepper(created_at DESC)`, [])

    console.log("Pepper tables created successfully")

    return NextResponse.json({
      success: true,
      message: "Pepper tables created successfully in processing_db",
      tables: ["pg_pepper", "hf_pepper", "mv_pepper"],
    })
  } catch (error: any) {
    console.error("Error creating pepper tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create pepper tables",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
