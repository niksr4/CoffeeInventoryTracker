import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Parse the base connection string
const baseUrl = process.env.DATABASE_URL

// Helper to replace database name in connection string
function getDatabaseUrl(dbName: string): string {
  const url = new URL(baseUrl)
  url.pathname = `/${dbName}`
  return url.toString()
}

// Create separate connections for each database
export const inventorySql = neon(getDatabaseUrl("inventory_db"))
export const accountsSql = neon(getDatabaseUrl("accounts_db"))

// Test connections
export async function testConnections() {
  try {
    const inventoryTest = await inventorySql`SELECT current_database(), version()`
    const accountsTest = await accountsSql`SELECT current_database(), version()`

    console.log("✅ Inventory DB connected:", inventoryTest[0].current_database)
    console.log("✅ Accounts DB connected:", accountsTest[0].current_database)

    return {
      inventory: inventoryTest[0].current_database,
      accounts: accountsTest[0].current_database,
      success: true,
    }
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Initialize all tables in both databases
export async function initializeTables() {
  try {
    console.log("🔧 Initializing all database tables...")

    // Initialize inventory tables
    await inventorySql`
      CREATE TABLE IF NOT EXISTS current_inventory (
        item_type VARCHAR(255) PRIMARY KEY,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'kg',
        avg_price DECIMAL(10,2) DEFAULT 0,
        total_cost DECIMAL(10,2) DEFAULT 0
      )
    `

    await inventorySql`
      CREATE TABLE IF NOT EXISTS transaction_history (
        id SERIAL PRIMARY KEY,
        item_type VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        notes TEXT,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        total_cost DECIMAL(10,2) DEFAULT 0
      )
    `

    await inventorySql`
      CREATE TABLE IF NOT EXISTS inventory_summary (
        id INTEGER PRIMARY KEY DEFAULT 1,
        total_inventory_value DECIMAL(15,2) DEFAULT 0,
        total_items INTEGER DEFAULT 0,
        total_quantity DECIMAL(15,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `

    // Initialize accounts tables
    await accountsSql`
      CREATE TABLE IF NOT EXISTS account_activities (
        code VARCHAR(50) PRIMARY KEY,
        activity TEXT NOT NULL
      )
    `

    await accountsSql`
      CREATE TABLE IF NOT EXISTS labor_transactions (
        id SERIAL PRIMARY KEY,
        deployment_date TIMESTAMP NOT NULL,
        code VARCHAR(50) NOT NULL,
        hf_laborers INTEGER DEFAULT 0,
        hf_cost_per_laborer DECIMAL(10,2) DEFAULT 0,
        outside_laborers INTEGER DEFAULT 0,
        outside_cost_per_laborer DECIMAL(10,2) DEFAULT 0,
        total_cost DECIMAL(10,2) NOT NULL,
        notes TEXT
      )
    `

    await accountsSql`
      CREATE TABLE IF NOT EXISTS expense_transactions (
        id SERIAL PRIMARY KEY,
        entry_date TIMESTAMP NOT NULL,
        code VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        notes TEXT
      )
    `

    console.log("✅ All database tables initialized successfully")

    return {
      success: true,
      message: "All tables initialized successfully",
    }
  } catch (error: any) {
    console.error("❌ Error initializing tables:", error)
    return {
      success: false,
      error: error.message || String(error),
    }
  }
}
