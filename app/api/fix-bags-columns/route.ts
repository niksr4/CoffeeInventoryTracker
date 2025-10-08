import { NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    // Step 1: Fix bags columns to DECIMAL
    const fixBagsResult = await processingSql`
      ALTER TABLE processing_records 
      ALTER COLUMN dry_p_bags TYPE DECIMAL(10, 2),
      ALTER COLUMN dry_p_bags_todate TYPE DECIMAL(10, 2),
      ALTER COLUMN dry_cherry_bags TYPE DECIMAL(10, 2),
      ALTER COLUMN dry_cherry_bags_todate TYPE DECIMAL(10, 2);
    `

    // Step 2: Fix percentage columns to have larger precision
    const fixPercentResult = await processingSql`
      ALTER TABLE processing_records
      ALTER COLUMN ripe_percent TYPE DECIMAL(10, 2),
      ALTER COLUMN green_percent TYPE DECIMAL(10, 2),
      ALTER COLUMN float_percent TYPE DECIMAL(10, 2),
      ALTER COLUMN fr_wp_percent TYPE DECIMAL(10, 2),
      ALTER COLUMN wp_dp_percent TYPE DECIMAL(10, 2),
      ALTER COLUMN dry_cherry_percent TYPE DECIMAL(10, 2);
    `

    // Get updated column info to confirm changes
    const columnInfo = await processingSql`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'processing_records'
        AND (column_name LIKE '%bags%' OR column_name LIKE '%percent%')
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      message: "Successfully altered bag and percentage columns",
      columnInfo,
    })
  } catch (error: any) {
    console.error("Error fixing columns:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
