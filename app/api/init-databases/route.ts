import { type NextRequest, NextResponse } from "next/server"
import { initializeInventoryTables } from "@/lib/neon-inventory-storage"
import { accountsSql } from "@/lib/neon-connections"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting database initialization...")

    // Initialize inventory database
    const inventoryResult = await initializeInventoryTables()
    if (!inventoryResult.success) {
      throw new Error(`Inventory DB init failed: ${inventoryResult.error}`)
    }

    // Initialize accounts database tables
    console.log("🔧 Initializing accounts database tables...")

    // Create labor_deployments table
    await accountsSql`
      CREATE TABLE IF NOT EXISTS labor_deployments (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        hours DECIMAL(10,2) NOT NULL,
        hourly_rate DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        deployment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create other_expenses table
    await accountsSql`
      CREATE TABLE IF NOT EXISTS other_expenses (
        id SERIAL PRIMARY KEY,
        expense_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create consumables table
    await accountsSql`
      CREATE TABLE IF NOT EXISTS consumables (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        unit_cost DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for better performance
    await accountsSql`
      CREATE INDEX IF NOT EXISTS idx_labor_deployments_date 
      ON labor_deployments(deployment_date)
    `

    await accountsSql`
      CREATE INDEX IF NOT EXISTS idx_other_expenses_date 
      ON other_expenses(expense_date)
    `

    await accountsSql`
      CREATE INDEX IF NOT EXISTS idx_consumables_date 
      ON consumables(purchase_date)
    `

    console.log("✅ All database tables initialized successfully")

    return NextResponse.json({
      success: true,
      message: "All database tables initialized successfully",
      details: {
        inventory: inventoryResult,
        accounts: "Initialized successfully",
      },
    })
  } catch (error: any) {
    console.error("❌ Error initializing databases:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to initialize databases",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Use POST to initialize databases",
    endpoint: "/api/init-databases",
  })
}
