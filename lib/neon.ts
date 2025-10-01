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

export async function createNeonTables(): Promise<void> {
  if (!sql) {
    throw new Error("Neon SQL client not initialized - DATABASE_URL missing")
  }

  try {
    console.log("🏗️ Creating Neon tables...")

    // Drop existing tables to start fresh
    await sql`DROP TABLE IF EXISTS labor_consumables CASCADE`
    await sql`DROP TABLE IF EXISTS inventory_transactions CASCADE`
    console.log("✅ Dropped existing tables")

    // Create inventory_transactions table
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
    console.log("✅ Created inventory_transactions table")

    // Create labor_consumables table
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
    console.log("✅ Created labor_consumables table")

    // Create indexes
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

export async function insertInventoryTransaction(data: {
  transactionId: string
  itemName: string
  transactionType: string
  quantity: number
  unit?: string
  unitPrice?: number
  totalValue?: number
  date: string
  notes?: string
  userId?: string
}): Promise<boolean> {
  if (!sql) {
    console.error("❌ Cannot insert - Neon SQL client not initialized")
    return false
  }

  try {
    await sql`
      INSERT INTO inventory_transactions (
        transaction_id, item_name, transaction_type, quantity, unit, 
        unit_price, total_value, date, notes, user_id
      ) VALUES (
        ${data.transactionId},
        ${data.itemName},
        ${data.transactionType},
        ${data.quantity},
        ${data.unit || "kg"},
        ${data.unitPrice || 0},
        ${data.totalValue || 0},
        ${data.date},
        ${data.notes || ""},
        ${data.userId || "system"}
      )
      ON CONFLICT (transaction_id) DO UPDATE SET
        item_name = EXCLUDED.item_name,
        transaction_type = EXCLUDED.transaction_type,
        quantity = EXCLUDED.quantity,
        unit = EXCLUDED.unit,
        unit_price = EXCLUDED.unit_price,
        total_value = EXCLUDED.total_value,
        date = EXCLUDED.date,
        notes = EXCLUDED.notes
    `

    return true
  } catch (error) {
    console.error("❌ Error inserting inventory transaction:", error)
    return false
  }
}

export async function insertLaborConsumable(data: {
  transactionId: string
  type: "labor" | "consumable"
  description: string
  amount: number
  unit?: string
  cost?: number
  date: string
  reference?: string
  notes?: string
  userId?: string
}): Promise<boolean> {
  if (!sql) {
    console.error("❌ Cannot insert - Neon SQL client not initialized")
    return false
  }

  try {
    await sql`
      INSERT INTO labor_consumables (
        transaction_id, type, description, amount, unit, cost, 
        date, reference, notes, user_id
      ) VALUES (
        ${data.transactionId},
        ${data.type},
        ${data.description},
        ${data.amount},
        ${data.unit || "units"},
        ${data.cost || 0},
        ${data.date},
        ${data.reference || ""},
        ${data.notes || ""},
        ${data.userId || "system"}
      )
      ON CONFLICT (transaction_id) DO UPDATE SET
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        amount = EXCLUDED.amount,
        unit = EXCLUDED.unit,
        cost = EXCLUDED.cost,
        date = EXCLUDED.date,
        reference = EXCLUDED.reference,
        notes = EXCLUDED.notes
    `

    return true
  } catch (error) {
    console.error("❌ Error inserting labor/consumable:", error)
    return false
  }
}

export async function getNeonStats() {
  if (!sql) {
    return {
      inventoryCount: 0,
      laborConsumableCount: 0,
    }
  }

  try {
    const inventoryResult = await sql`SELECT COUNT(*) as count FROM inventory_transactions`
    const laborResult = await sql`SELECT COUNT(*) as count FROM labor_consumables`

    return {
      inventoryCount: Number(inventoryResult[0]?.count || 0),
      laborConsumableCount: Number(laborResult[0]?.count || 0),
    }
  } catch (error) {
    console.error("Error getting Neon stats:", error)
    return {
      inventoryCount: 0,
      laborConsumableCount: 0,
    }
  }
}
