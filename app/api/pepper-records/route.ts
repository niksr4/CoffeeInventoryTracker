import { type NextRequest, NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

// Map location names to table names
const locationToTable: Record<string, string> = {
  "PG Pepper": "pg_pepper",
  "HF Pepper": "hf_pepper",
  "MV Pepper": "mv_pepper",
}

function getTableName(location: string): string {
  const tableName = locationToTable[location]
  if (!tableName) {
    throw new Error(`Invalid location: ${location}`)
  }
  return tableName
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const location = searchParams.get("location") || "HF Pepper"
    const tableName = getTableName(location)

    console.log("GET pepper request - location:", location, "tableName:", tableName, "date:", date)

    if (date) {
      // Get a specific record by date
      const query = `SELECT * FROM ${tableName} WHERE DATE(process_date) = $1 ORDER BY id DESC LIMIT 1`
      console.log("Executing query:", query, [date])

      const result = await processingSql.query(query, [date])
      console.log("Query result:", result)

      if (result && result.rows && result.rows.length > 0) {
        const record = result.rows[0]
        const numericFields = ["kg_picked", "green_pepper", "green_pepper_percent", "dry_pepper", "dry_pepper_percent"]

        numericFields.forEach((field) => {
          if (record[field] !== null && record[field] !== undefined) {
            record[field] = Number(record[field])
          }
        })

        return NextResponse.json({ success: true, record })
      } else {
        return NextResponse.json({ success: true, record: null })
      }
    } else {
      // Get all records, most recent first
      const query = `SELECT * FROM ${tableName} ORDER BY process_date DESC LIMIT 30`
      console.log("Executing query:", query)

      const results = await processingSql.query(query, [])
      console.log("Query results:", results)

      if (!results || !results.rows || !Array.isArray(results.rows)) {
        return NextResponse.json({ success: true, records: [] })
      }

      const records = results.rows.map((record: any) => {
        const numericFields = ["kg_picked", "green_pepper", "green_pepper_percent", "dry_pepper", "dry_pepper_percent"]

        numericFields.forEach((field) => {
          if (record[field] !== null && record[field] !== undefined) {
            record[field] = Number(record[field])
          }
        })

        return record
      })

      return NextResponse.json({ success: true, records })
    }
  } catch (error: any) {
    console.error("Error fetching pepper records:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ success: false, error: error.message, records: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const location = data.location || "HF Pepper"
    const tableName = getTableName(location)

    console.log("Saving to pepper table:", tableName, "with data:", data)

    const record = {
      process_date: data.process_date,
      kg_picked: data.kg_picked ?? 0,
      green_pepper: data.green_pepper ?? 0,
      green_pepper_percent: Number(data.green_pepper_percent) || 0,
      dry_pepper: data.dry_pepper ?? 0,
      dry_pepper_percent: Number(data.dry_pepper_percent) || 0,
      notes: data.notes || "",
      recorded_by: data.recorded_by || "unknown",
    }

    const query = `
      INSERT INTO ${tableName} (
        process_date, kg_picked, green_pepper, green_pepper_percent,
        dry_pepper, dry_pepper_percent, notes, recorded_by
      )
      VALUES ($1::date, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (process_date)
      DO UPDATE SET
        kg_picked = EXCLUDED.kg_picked,
        green_pepper = EXCLUDED.green_pepper,
        green_pepper_percent = EXCLUDED.green_pepper_percent,
        dry_pepper = EXCLUDED.dry_pepper,
        dry_pepper_percent = EXCLUDED.dry_pepper_percent,
        notes = EXCLUDED.notes,
        recorded_by = EXCLUDED.recorded_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await processingSql.query(query, [
      record.process_date,
      record.kg_picked,
      record.green_pepper,
      record.green_pepper_percent,
      record.dry_pepper,
      record.dry_pepper_percent,
      record.notes,
      record.recorded_by,
    ])

    console.log("Database insert/update result:", result.rows[0])

    return NextResponse.json({ success: true, record: result.rows[0] })
  } catch (error: any) {
    console.error("Error saving pepper record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const location = searchParams.get("location") || "HF Pepper"
    const tableName = getTableName(location)

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    const query = `DELETE FROM ${tableName} WHERE DATE(process_date) = $1`
    await processingSql.query(query, [date])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting pepper record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
