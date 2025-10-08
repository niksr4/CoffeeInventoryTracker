import { NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (date) {
      // Get specific record by date
      const result = await processingSql`
        SELECT * FROM processing_records 
        WHERE process_date = ${date}
      `

      if (result.length === 0) {
        return NextResponse.json({ success: true, record: null })
      }

      return NextResponse.json({ success: true, record: result[0] })
    } else {
      // Get recent records (last 30 days)
      const result = await processingSql`
        SELECT * FROM processing_records 
        ORDER BY process_date DESC 
        LIMIT 30
      `

      return NextResponse.json({ success: true, records: result })
    }
  } catch (error: any) {
    console.error("Error fetching processing records:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      process_date,
      crop_today,
      crop_todate,
      ripe_today,
      ripe_todate,
      ripe_percent,
      green_today,
      green_todate,
      green_percent,
      float_today,
      float_todate,
      float_percent,
      wet_parchment,
      fr_wp_percent,
      dry_parch,
      dry_p_todate,
      wp_dp_percent,
      dry_cherry,
      dry_cherry_todate,
      dry_cherry_percent,
      dry_p_bags,
      dry_p_bags_todate,
      dry_cherry_bags,
      dry_cherry_bags_todate,
      notes,
    } = body

    const result = await processingSql`
      INSERT INTO processing_records (
        process_date,
        crop_today, crop_todate,
        ripe_today, ripe_todate, ripe_percent,
        green_today, green_todate, green_percent,
        float_today, float_todate, float_percent,
        wet_parchment, fr_wp_percent,
        dry_parch, dry_p_todate, wp_dp_percent,
        dry_cherry, dry_cherry_todate, dry_cherry_percent,
        dry_p_bags, dry_p_bags_todate,
        dry_cherry_bags, dry_cherry_bags_todate,
        notes
      ) VALUES (
        ${process_date},
        ${crop_today || 0}, ${crop_todate || 0},
        ${ripe_today || 0}, ${ripe_todate || 0}, ${ripe_percent || 0},
        ${green_today || 0}, ${green_todate || 0}, ${green_percent || 0},
        ${float_today || 0}, ${float_todate || 0}, ${float_percent || 0},
        ${wet_parchment || 0}, ${fr_wp_percent || 0},
        ${dry_parch || 0}, ${dry_p_todate || 0}, ${wp_dp_percent || 0},
        ${dry_cherry || 0}, ${dry_cherry_todate || 0}, ${dry_cherry_percent || 0},
        ${dry_p_bags || 0}, ${dry_p_bags_todate || 0},
        ${dry_cherry_bags || 0}, ${dry_cherry_bags_todate || 0},
        ${notes || null}
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

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error: any) {
    console.error("Error saving processing record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    return NextResponse.json({ success: true, message: "Record deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting processing record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
