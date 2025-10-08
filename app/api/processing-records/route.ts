import { type NextRequest, NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (date) {
      // Get a specific record by date
      const result = await processingSql`
        SELECT * FROM processing_records
        WHERE process_date = ${date}
        ORDER BY id DESC
        LIMIT 1
      `

      if (result.length > 0) {
        // Convert all numeric string fields to actual numbers
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
        return NextResponse.json({ success: false, record: null })
      }
    } else {
      // Get all records, most recent first
      const results = await processingSql`
        SELECT * FROM processing_records
        ORDER BY process_date DESC
        LIMIT 10
      `

      // Convert all numeric string fields to actual numbers for each record
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log("Received data for save:", data)

    // Convert null to 0 for numeric fields
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

    console.log("Processed record for database:", record)

    // Use INSERT ... ON CONFLICT to update if exists, insert if new
    const result = await processingSql`
      INSERT INTO processing_records (
        process_date, crop_today, crop_todate, ripe_today, ripe_todate, ripe_percent,
        green_today, green_todate, green_percent, float_today, float_todate, float_percent,
        wet_parchment, fr_wp_percent, dry_parch, dry_p_todate, wp_dp_percent,
        dry_cherry, dry_cherry_todate, dry_cherry_percent,
        dry_p_bags, dry_p_bags_todate, dry_cherry_bags, dry_cherry_bags_todate, notes
      )
      VALUES (
        ${record.process_date}, ${record.crop_today}, ${record.crop_todate}, ${record.ripe_today},
        ${record.ripe_todate}, ${record.ripe_percent}, ${record.green_today}, ${record.green_todate},
        ${record.green_percent}, ${record.float_today}, ${record.float_todate}, ${record.float_percent},
        ${record.wet_parchment}, ${record.fr_wp_percent}, ${record.dry_parch}, ${record.dry_p_todate},
        ${record.wp_dp_percent}, ${record.dry_cherry}, ${record.dry_cherry_todate},
        ${record.dry_cherry_percent}, ${record.dry_p_bags}, ${record.dry_p_bags_todate},
        ${record.dry_cherry_bags}, ${record.dry_cherry_bags_todate}, ${record.notes}
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
        notes = EXCLUDED.notes
      RETURNING *
    `

    console.log("Database insert/update result:", result)

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

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    await processingSql`
      DELETE FROM processing_records
      WHERE process_date = ${date}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting processing record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
