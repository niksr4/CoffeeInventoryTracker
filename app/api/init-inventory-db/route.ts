import { NextResponse } from "next/server"
import { initializeTables, testConnections, inventorySql } from "@/lib/neon-connections"

export async function POST() {
  try {
    console.log("🚀 Starting database initialization...")

    // Test connections first
    const connectionStatus = await testConnections()

    if (!connectionStatus.inventory) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot connect to inventory database",
          connectionStatus,
        },
        { status: 500 },
      )
    }

    // Initialize tables
    await initializeTables()

    console.log("🔨 Creating current_inventory table...")

    // Drop table if exists (for clean slate)
    await inventorySql`DROP TABLE IF EXISTS current_inventory`

    // Create the table with the correct schema
    await inventorySql`
      CREATE TABLE current_inventory (
        item_name VARCHAR(100) PRIMARY KEY,
        current_quantity NUMERIC DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'kg',
        category VARCHAR(50) DEFAULT 'general',
        price NUMERIC DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("✅ Table created successfully")

    // Insert some initial test data
    await inventorySql`
      INSERT INTO current_inventory (item_name, current_quantity, unit, price)
      VALUES 
        ('Arabica Beans', 100, 'kg', 25.50),
        ('Robusta Beans', 75, 'kg', 18.00),
        ('Sugar', 50, 'kg', 2.50),
        ('Milk', 30, 'L', 1.20)
      ON CONFLICT (item_name) DO NOTHING
    `

    // Verify the table structure
    const columns = await inventorySql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'current_inventory'
      ORDER BY ordinal_position
    `

    // Get sample data
    const data = await inventorySql`SELECT * FROM current_inventory LIMIT 5`

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      connectionStatus,
      schema: columns,
      sampleData: data,
    })
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const connectionStatus = await testConnections()

    return NextResponse.json({
      success: true,
      connectionStatus,
      message: "Connection test completed",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}
