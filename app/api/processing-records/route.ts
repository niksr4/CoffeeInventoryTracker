import { type NextRequest, NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

// Map location names to table names
const locationToTable: Record<string, string> = {
  "HF Arabica": "hf_arabica",
  "HF Robusta": "hf_robusta",
  "MV Robusta": "mv_robusta",
  "PG Robusta": "pg_robusta",
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
    const location = searchParams.get("location") || "HF Arabica"
    const tableName = getTableName(location)

    console.log("GET request - location:", location, "tableName:", tableName, "date:", date)

    if (date) {
      // Get a specific record by date - use DATE() to compare only the date part
      const query = `SELECT * FROM ${tableName} WHERE DATE(process_date) = $1 ORDER BY id DESC LIMIT 1`
      console.log("Executing query:", query, [date])

      const result = await processingSql.query(query, [date])
      console.log("Query result:", result)

      if (result && Array.isArray(result) && result.length > 0) {
        const record = result[0]
        const numericFields = [
          "crop_today",
          "crop_todate",
          "ripe_today",
          "ripe_todate",
          "ripe_percent",
          "green_today",
          "green_todate",
          "green_percent",
          "float_today",
          "float_todate",
          "float_percent",
          "wet_parchment",
          "fr_wp_percent",
          "dry_parch",
          "dry_p_todate",
          "wp_dp_percent",
          "dry_cherry",
          "dry_cherry_todate",
          "dry_cherry_percent",
          "dry_p_bags",
          "dry_p_bags_todate",
          "dry_cherry_bags",
          "dry_cherry_bags_todate",
        ]

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

      if (!results || !Array.isArray(results)) {
        return NextResponse.json({ success: true, records: [] })
      }

      const records = results.map((record: any) => {
        const numericFields = [
          "crop_today",
          "crop_todate",
          "ripe_today",
          "ripe_todate",
          "ripe_percent",
          "green_today",
          "green_todate",
          "green_percent",
          "float_today",
          "float_todate",
          "float_percent",
          "wet_parchment",
          "fr_wp_percent",
          "dry_parch",
          "dry_p_todate",
          "wp_dp_percent",
          "dry_cherry",
          "dry_cherry_todate",
          "dry_cherry_percent",
          "dry_p_bags",
          "dry_p_bags_todate",
          "dry_cherry_bags",
          "dry_cherry_bags_todate",
        ]

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
    console.error("Error fetching processing records:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ success: false, error: error.message, records: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const location = data.location || "HF Arabica"
    const tableName = getTableName(location)

    console.log("Saving to table:", tableName, "with data:", data)

    const record = {
      process_date: data.process_date,
      crop_today: data.crop_today ?? 0,
      crop_todate: Number(data.crop_todate) || 0,
      ripe_today: data.ripe_today ?? 0,
      ripe_todate: Number(data.ripe_todate) || 0,
      ripe_percent: Number(data.ripe_percent) || 0,
      green_today: data.green_today ?? 0,
      green_todate: Number(data.green_todate) || 0,
      green_percent: Number(data.green_percent) || 0,
      float_today: data.float_today ?? 0,
      float_todate: Number(data.float_todate) || 0,
      float_percent: Number(data.float_percent) || 0,
      wet_parchment: data.wet_parchment ?? 0,
      fr_wp_percent: Number(data.fr_wp_percent) || 0,
      dry_parch: data.dry_parch ?? 0,
      dry_p_todate: Number(data.dry_p_todate) || 0,
      wp_dp_percent: Number(data.wp_dp_percent) || 0,
      dry_cherry: data.dry_cherry ?? 0,
      dry_cherry_todate: Number(data.dry_cherry_todate) || 0,
      dry_cherry_percent: Number(data.dry_cherry_percent) || 0,
      dry_p_bags: Number(data.dry_p_bags) || 0,
      dry_p_bags_todate: Number(data.dry_p_bags_todate) || 0,
      dry_cherry_bags: Number(data.dry_cherry_bags) || 0,
      dry_cherry_bags_todate: Number(data.dry_cherry_bags_todate) || 0,
      notes: data.notes || "",
    }

    // Use DATE() to ensure only one record per date
    const query = `
      INSERT INTO ${tableName} (
        process_date, crop_today, crop_todate, ripe_today, ripe_todate, ripe_percent,
        green_today, green_todate, green_percent, float_today, float_todate, float_percent,
        wet_parchment, fr_wp_percent, dry_parch, dry_p_todate, wp_dp_percent,
        dry_cherry, dry_cherry_todate, dry_cherry_percent,
        dry_p_bags, dry_p_bags_todate, dry_cherry_bags, dry_cherry_bags_todate, notes
      )
      VALUES (
        $1::date, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (process_date)
      DO UPDATE SET
        crop_today = EXCLUDED.crop_today,
        crop_todate = EXCLUDED.crop_todate,
        ripe_today = EXCLUDED.ripe_today,
        ripe_todate = EXCLUDED.ripe_todate,
        ripe_percent = EXCLUDED.ripe_percent,
        green_today = EXCLUDED.green_today,
        green_todate = EXCLUDED.green_todate,
        green_percent = EXCLUDED.green_percent,
        float_today = EXCLUDED.float_today,
        float_todate = EXCLUDED.float_todate,
        float_percent = EXCLUDED.float_percent,
        wet_parchment = EXCLUDED.wet_parchment,
        fr_wp_percent = EXCLUDED.fr_wp_percent,
        dry_parch = EXCLUDED.dry_parch,
        dry_p_todate = EXCLUDED.dry_p_todate,
        wp_dp_percent = EXCLUDED.wp_dp_percent,
        dry_cherry = EXCLUDED.dry_cherry,
        dry_cherry_todate = EXCLUDED.dry_cherry_todate,
        dry_cherry_percent = EXCLUDED.dry_cherry_percent,
        dry_p_bags = EXCLUDED.dry_p_bags,
        dry_p_bags_todate = EXCLUDED.dry_p_bags_todate,
        dry_cherry_bags = EXCLUDED.dry_cherry_bags,
        dry_cherry_bags_todate = EXCLUDED.dry_cherry_bags_todate,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await processingSql.query(query, [
      record.process_date,
      record.crop_today,
      record.crop_todate,
      record.ripe_today,
      record.ripe_todate,
      record.ripe_percent,
      record.green_today,
      record.green_todate,
      record.green_percent,
      record.float_today,
      record.float_todate,
      record.float_percent,
      record.wet_parchment,
      record.fr_wp_percent,
      record.dry_parch,
      record.dry_p_todate,
      record.wp_dp_percent,
      record.dry_cherry,
      record.dry_cherry_todate,
      record.dry_cherry_percent,
      record.dry_p_bags,
      record.dry_p_bags_todate,
      record.dry_cherry_bags,
      record.dry_cherry_bags_todate,
      record.notes,
    ])

    console.log("Database insert/update result:", result[0])

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error: any) {
    console.error("Error saving processing record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const location = searchParams.get("location") || "HF Arabica"
    const tableName = getTableName(location)

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    // Use DATE() to match the date part
    const query = `DELETE FROM ${tableName} WHERE DATE(process_date) = $1`
    await processingSql.query(query, [date])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting processing record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
