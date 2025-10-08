import { NextResponse } from "next/server"
import { processingSql } from "@/lib/neon-connections"

export async function POST() {
  try {
    console.log("Starting processing_db table initialization...")

    // Check if we can connect to the database
    const connectionTest = await processingSql`SELECT current_database()`
    console.log("Connected to database:", connectionTest[0]?.current_database)

    // Create the processing_records table
    await processingSql`
      CREATE TABLE IF NOT EXISTS processing_records (
        id SERIAL PRIMARY KEY,
        process_date DATE NOT NULL UNIQUE,
        
        -- Crop data
        crop_today DECIMAL(10, 2) DEFAULT 0,
        crop_todate DECIMAL(10, 2) DEFAULT 0,
        
        -- Ripe cherry
        ripe_today DECIMAL(10, 2) DEFAULT 0,
        ripe_todate DECIMAL(10, 2) DEFAULT 0,
        ripe_percent DECIMAL(5, 2) DEFAULT 0,
        
        -- Green cherry
        green_today DECIMAL(10, 2) DEFAULT 0,
        green_todate DECIMAL(10, 2) DEFAULT 0,
        green_percent DECIMAL(5, 2) DEFAULT 0,
        
        -- Float
        float_today DECIMAL(10, 2) DEFAULT 0,
        float_todate DECIMAL(10, 2) DEFAULT 0,
        float_percent DECIMAL(5, 2) DEFAULT 0,
        
        -- Wet parchment
        wet_parchment DECIMAL(10, 2) DEFAULT 0,
        fr_wp_percent DECIMAL(5, 2) DEFAULT 0,
        
        -- Dry parchment
        dry_parch DECIMAL(10, 2) DEFAULT 0,
        dry_p_todate DECIMAL(10, 2) DEFAULT 0,
        wp_dp_percent DECIMAL(5, 2) DEFAULT 0,
        
        -- Dry cherry
        dry_cherry DECIMAL(10, 2) DEFAULT 0,
        dry_cherry_todate DECIMAL(10, 2) DEFAULT 0,
        dry_cherry_percent DECIMAL(5, 2) DEFAULT 0,
        
        -- Bags
        dry_p_bags DECIMAL(10, 2) DEFAULT 0,
        dry_p_bags_todate DECIMAL(10, 2) DEFAULT 0,
        dry_cherry_bags DECIMAL(10, 2) DEFAULT 0,
        dry_cherry_bags_todate DECIMAL(10, 2) DEFAULT 0,
        
        -- Notes
        notes TEXT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("Processing records table created successfully")

    // Create index for faster date lookups
    await processingSql`
      CREATE INDEX IF NOT EXISTS idx_processing_date ON processing_records(process_date DESC)
    `

    console.log("Index created successfully")

    // Verify table structure
    const tableInfo = await processingSql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'processing_records'
      ORDER BY ordinal_position
    `

    console.log("Table structure verified:", tableInfo.length, "columns")

    return NextResponse.json({
      success: true,
      message: "Processing database initialized successfully",
      database: connectionTest[0]?.current_database,
      columns: tableInfo.length,
      tableStructure: tableInfo,
    })
  } catch (error: any) {
    console.error("Error initializing processing database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check database connection and table status
    const dbCheck = await processingSql`SELECT current_database()`
    const tableCheck = await processingSql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'processing_records'
      )
    `

    const recordCount = await processingSql`
      SELECT COUNT(*) as count FROM processing_records
    `

    return NextResponse.json({
      success: true,
      database: dbCheck[0]?.current_database,
      tableExists: tableCheck[0]?.exists,
      recordCount: recordCount[0]?.count || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
      },
      { status: 500 },
    )
  }
}
