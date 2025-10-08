import { NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"
import { format } from "date-fns"

export async function GET() {
  try {
    // Check connection
    const connectionTest = await processingSql`SELECT 1 as connection_test`

    // Check table existence
    const tableCheck = await processingSql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'processing_records'
      ) as table_exists
    `

    // Get column info
    const columnInfo = await processingSql`
      SELECT column_name, data_type, character_maximum_length, 
             numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'processing_records'
      ORDER BY ordinal_position
    `

    // Get record count
    const recordCount = await processingSql`
      SELECT COUNT(*) as count FROM processing_records
    `

    // Get a sample record if any exist
    const sampleRecord = await processingSql`
      SELECT * FROM processing_records LIMIT 1
    `

    return NextResponse.json({
      success: true,
      connectionTest: connectionTest[0],
      tableExists: tableCheck[0].table_exists,
      columnInfo,
      recordCount: recordCount[0].count,
      sampleRecord: sampleRecord[0] || null,
      timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    })
  } catch (error: any) {
    console.error("Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Try to insert a test record
    const testDate = format(new Date(), "yyyy-MM-dd")

    const testRecord = await processingSql`
      INSERT INTO processing_records (
        process_date, crop_today, crop_todate,
        ripe_today, ripe_todate, ripe_percent
      )
      VALUES (
        ${testDate}, 100, 100,
        80, 80, 80.0
      )
      ON CONFLICT (process_date) 
      DO UPDATE SET
        crop_today = EXCLUDED.crop_today
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      testRecord: testRecord[0],
      message: "Test record successfully inserted/updated",
      timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    })
  } catch (error: any) {
    console.error("Test record insertion failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
      { status: 500 },
    )
  }
}
