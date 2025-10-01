import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set")
}

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export async function testNeonConnection(): Promise<boolean> {
  if (!sql) {
    console.error("❌ Neon SQL client not initialized - DATABASE_URL missing")
    return false
  }

  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log("✅ Neon connection successful:", result[0])
    return true
  } catch (error) {
    console.error("❌ Neon connection failed:", error)
    return false
  }
}

// Alias for backward compatibility
export const testConnection = testNeonConnection

export async function createNeonTables(): Promise<void> {
  if (!sql) {
    throw new Error("Neon SQL client not initialized - DATABASE_URL missing")
  }

  try {
    console.log("🏗️ Creating Neon tables...")

    await sql`DROP TABLE IF EXISTS labor_consumables CASCADE`
    await sql`DROP TABLE IF EXISTS inventory_transactions CASCADE`

    await sql`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE,
        item_name VARCHAR(255) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) DEFAULT 'kg',
        unit_price DECIMAL(10,2) DEFAULT 0,
        total_value DECIMAL(10,2) DEFAULT 0,
        date DATE NOT NULL,
        notes TEXT,
        user_id VARCHAR(100) DEFAULT 'system',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS labor_consumables (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) DEFAULT 'units',
        cost DECIMAL(10,2) DEFAULT 0,
        date DATE NOT NULL,
        reference VARCHAR(255),
        notes TEXT,
        user_id VARCHAR(100) DEFAULT 'system',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_name ON inventory_transactions(item_name)`
    await sql`CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_labor_consumables_type ON labor_consumables(type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_labor_consumables_date ON labor_consumables(date)`

    console.log("✅ All Neon tables and indexes created successfully")
  } catch (error) {
    console.error("❌ Failed to create Neon tables:", error)
    throw error
  }
}

// Aliases for backward compatibility
export const createTables = createNeonTables
export const initializeNeonTables = createNeonTables
