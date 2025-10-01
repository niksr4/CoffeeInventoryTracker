import { inventorySql } from "./neon-connections"

export interface InventoryItem {
  name: string
  quantity: number
  unit: string
  avg_price?: number
  total_cost?: number
}

export interface Transaction {
  id?: number
  item_type: string
  quantity: number
  transaction_type: "restock" | "deplete"
  notes?: string
  transaction_date?: string
  user_id: string
  price?: number
  total_cost?: number
  unit?: string
}

export interface InventorySummary {
  total_inventory_value: number
  total_items: number
  total_quantity: number
}

export async function initializeInventoryTables() {
  try {
    console.log("🔧 Initializing inventory database tables...")

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

    await inventorySql`
      INSERT INTO inventory_summary (id, total_inventory_value, total_items, total_quantity)
      VALUES (1, 0, 0, 0)
      ON CONFLICT (id) DO NOTHING
    `

    console.log("✅ Inventory database tables initialized successfully")

    return {
      success: true,
      message: "Inventory tables initialized successfully",
    }
  } catch (error: any) {
    console.error("❌ Error initializing inventory tables:", error)
    return {
      success: false,
      error: error.message || String(error),
    }
  }
}

export async function getCurrentInventory(includeZero = true): Promise<InventoryItem[]> {
  try {
    const result = await inventorySql`
      SELECT 
        item_type,
        quantity,
        unit,
        avg_price,
        total_cost
      FROM current_inventory
      ${includeZero ? inventorySql`` : inventorySql`WHERE quantity > 0`}
      ORDER BY item_type
    `

    return result.map((row: any) => ({
      name: String(row.item_type),
      quantity: Number(row.quantity) || 0,
      unit: String(row.unit || "kg"),
      avg_price: row.avg_price ? Number(row.avg_price) : undefined,
      total_cost: row.total_cost ? Number(row.total_cost) : undefined,
    }))
  } catch (error: any) {
    console.error("❌ Error fetching inventory:", error?.message || error)
    return []
  }
}

export async function getInventorySummary(): Promise<InventorySummary> {
  try {
    const result = await inventorySql`
      SELECT 
        COALESCE(SUM(total_cost), 0) as total_inventory_value,
        COUNT(DISTINCT item_type) as total_items,
        COALESCE(SUM(quantity), 0) as total_quantity
      FROM current_inventory
    `

    return {
      total_inventory_value: Number(result[0]?.total_inventory_value) || 0,
      total_items: Number(result[0]?.total_items) || 0,
      total_quantity: Number(result[0]?.total_quantity) || 0,
    }
  } catch (error: any) {
    console.error("❌ Error fetching summary:", error?.message || error)
    return {
      total_inventory_value: 0,
      total_items: 0,
      total_quantity: 0,
    }
  }
}

export async function getTransactionHistory(limit = 100): Promise<Transaction[]> {
  try {
    const result = await inventorySql`
      SELECT 
        th.id,
        th.item_type,
        th.quantity,
        th.transaction_type,
        th.notes,
        th.transaction_date,
        th.user_id,
        th.price,
        th.total_cost,
        COALESCE(ci.unit, 'kg') as unit
      FROM transaction_history th
      LEFT JOIN current_inventory ci ON th.item_type = ci.item_type
      ORDER BY th.transaction_date DESC
      LIMIT ${limit}
    `

    return result.map((row: any) => ({
      id: Number(row.id),
      item_type: String(row.item_type),
      quantity: Number(row.quantity) || 0,
      transaction_type: String(row.transaction_type) as "restock" | "deplete",
      notes: row.notes ? String(row.notes) : "",
      transaction_date: String(row.transaction_date),
      user_id: String(row.user_id),
      price: Number(row.price) || 0,
      total_cost: Number(row.total_cost) || 0,
      unit: String(row.unit || "kg"),
    }))
  } catch (error: any) {
    console.error("❌ Error fetching transactions:", error?.message || error)
    return []
  }
}

export async function addTransaction(transaction: {
  item_type: string
  quantity: number
  transaction_type: "restock" | "deplete"
  notes?: string
  user_id?: string
  price: number
}) {
  try {
    const total_cost = transaction.quantity * transaction.price

    await inventorySql`
      INSERT INTO transaction_history (
        item_type, quantity, transaction_type, notes, user_id, price, total_cost
      )
      VALUES (
        ${transaction.item_type},
        ${transaction.quantity},
        ${transaction.transaction_type},
        ${transaction.notes || ""},
        ${transaction.user_id || "system"},
        ${transaction.price},
        ${total_cost}
      )
    `

    return true
  } catch (error: any) {
    console.error("❌ Error adding transaction:", error?.message || error)
    return false
  }
}

export async function performBatchOperation(transactions: Transaction[]): Promise<boolean> {
  try {
    console.log(`🔄 Performing batch operation with ${transactions.length} transactions`)
    for (const txn of transactions) {
      await addTransaction({
        item_type: txn.item_type,
        quantity: txn.quantity,
        transaction_type: txn.transaction_type,
        notes: txn.notes,
        user_id: txn.user_id,
        price: txn.price || 0,
      })
    }
    console.log("✅ Batch operation completed successfully")
    return true
  } catch (error) {
    console.error("❌ Error in batch operation:", error)
    return false
  }
}

export async function getLastUpdateTimestamp(): Promise<number> {
  try {
    const result = await inventorySql`
      SELECT EXTRACT(EPOCH FROM MAX(transaction_date))::bigint * 1000 as timestamp
      FROM transaction_history
    `
    return Number(result[0]?.timestamp) || Date.now()
  } catch (error) {
    console.error("Error getting last update timestamp:", error)
    return Date.now()
  }
}

export async function checkIfDataExists(): Promise<boolean> {
  try {
    const result = await inventorySql`
      SELECT COUNT(*) as count FROM transaction_history
    `
    return Number(result[0]?.count) > 0
  } catch (error) {
    console.error("Error checking if data exists:", error)
    return false
  }
}

export async function initializeDefaultDataIfEmpty(): Promise<void> {
  try {
    const hasData = await checkIfDataExists()
    if (!hasData) {
      console.log("📦 No data found, initializing with default data if needed")
      // Initialize with empty state - ready for first transaction
      await inventorySql`
        INSERT INTO inventory_summary (id, total_inventory_value, total_items, total_quantity)
        VALUES (1, 0, 0, 0)
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch (error) {
    console.error("Error initializing default data:", error)
  }
}

export async function getAllInventoryItems(includeZero = true): Promise<InventoryItem[]> {
  return getCurrentInventory(includeZero)
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return getTransactionHistory(1000)
}

export async function getTransactionsByItem(itemType: string): Promise<Transaction[]> {
  try {
    const result = await inventorySql`
      SELECT 
        th.id,
        th.item_type, 
        COALESCE(th.quantity, 0) as quantity,
        th.transaction_type, 
        th.notes, 
        th.transaction_date,
        th.user_id, 
        COALESCE(th.price, 0) as price, 
        COALESCE(th.total_cost, 0) as total_cost,
        COALESCE(ci.unit, 'kg') as unit
      FROM transaction_history th
      LEFT JOIN current_inventory ci ON th.item_type = ci.item_type
      WHERE th.item_type = ${itemType}
      ORDER BY th.transaction_date DESC
    `
    return result.map((row: any) => ({
      id: Number(row.id),
      item_type: String(row.item_type),
      quantity: Number(row.quantity) || 0,
      transaction_type: String(row.transaction_type) as "restock" | "deplete",
      notes: row.notes ? String(row.notes) : "",
      transaction_date: String(row.transaction_date),
      user_id: String(row.user_id),
      price: Number(row.price) || 0,
      total_cost: Number(row.total_cost) || 0,
      unit: String(row.unit || "kg"),
    }))
  } catch (error: any) {
    console.error("❌ Error fetching transactions by item:", error?.message || error)
    return []
  }
}

export async function getInventoryItemByName(name: string): Promise<InventoryItem | null> {
  try {
    const items = await inventorySql`
      SELECT 
        item_type,
        quantity,
        unit,
        avg_price,
        total_cost
      FROM current_inventory
      WHERE item_type = ${name}
    `
    if (!items || items.length === 0) return null

    return {
      name: String(items[0].item_type),
      quantity: Number(items[0].quantity) || 0,
      unit: String(items[0].unit || "kg"),
      avg_price: items[0].avg_price ? Number(items[0].avg_price) : undefined,
      total_cost: items[0].total_cost ? Number(items[0].total_cost) : undefined,
    }
  } catch (error) {
    console.error("Error fetching item:", error)
    return null
  }
}

export async function upsertInventoryItem(item: InventoryItem): Promise<boolean> {
  try {
    await inventorySql`
      INSERT INTO current_inventory (item_type, quantity, unit, avg_price, total_cost)
      VALUES (
        ${item.name}, 
        ${item.quantity}, 
        ${item.unit || "kg"},
        ${item.avg_price || 0},
        ${item.total_cost || 0}
      )
      ON CONFLICT (item_type) 
      DO UPDATE SET
        quantity = ${item.quantity},
        unit = ${item.unit || "kg"},
        avg_price = ${item.avg_price || 0},
        total_cost = ${item.total_cost || 0}
    `
    return true
  } catch (error) {
    console.error("Error upserting inventory item:", error)
    return false
  }
}

export async function updateInventoryItem(
  item_type: string,
  updates: {
    quantity?: number
    unit?: string
  },
) {
  try {
    const setClauses: string[] = []
    if (updates.quantity !== undefined) {
      setClauses.push(`quantity = ${updates.quantity}`)
    }
    if (updates.unit !== undefined) {
      setClauses.push(`unit = '${updates.unit}'`)
    }

    if (setClauses.length === 0) {
      return null
    }

    const result = await inventorySql`
      UPDATE current_inventory
      SET ${inventorySql.unsafe(setClauses.join(", "))}
      WHERE item_type = ${item_type}
      RETURNING *
    `

    return result[0]
  } catch (error: any) {
    console.error("❌ Error updating inventory item:", error?.message || error)
    throw new Error(`Failed to update inventory item: ${error?.message || "Unknown error"}`)
  }
}

export async function deleteInventoryItem(item_type: string) {
  try {
    const result = await inventorySql`
      DELETE FROM current_inventory
      WHERE item_type = ${item_type}
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error(`Item ${item_type} not found`)
    }

    return result[0]
  } catch (error: any) {
    console.error("❌ Error deleting inventory item:", error?.message || error)
    throw new Error(`Failed to delete inventory item: ${error?.message || "Unknown error"}`)
  }
}

export async function addInventoryTransaction(transaction: Transaction): Promise<boolean> {
  try {
    await inventorySql`
      INSERT INTO transaction_history (
        item_type,
        quantity,
        transaction_type,
        notes,
        transaction_date,
        user_id,
        price,
        total_cost
      )
      VALUES (
        ${transaction.item_type},
        ${transaction.quantity},
        ${transaction.transaction_type},
        ${transaction.notes || ""},
        ${transaction.transaction_date || new Date().toISOString()},
        ${transaction.user_id},
        ${transaction.price || 0},
        ${transaction.total_cost || 0}
      )
    `
    return true
  } catch (error) {
    console.error("Error adding transaction:", error)
    return false
  }
}

export async function addTransactions(
  transactions: Array<{
    item_type: string
    quantity: number
    transaction_type: "restock" | "deplete"
    notes?: string
    user_id?: string
    price: number
  }>,
) {
  const results = []
  for (const txn of transactions) {
    const result = await addTransaction(txn)
    results.push(result)
  }
  return results
}

export async function addInventoryItem(item: {
  item_type: string
  quantity: number
  unit: string
  price: number
  user_id?: string
}) {
  return addTransaction({
    item_type: item.item_type,
    quantity: item.quantity,
    transaction_type: "restock",
    notes: `New item added: ${item.item_type}`,
    price: item.price,
    user_id: item.user_id,
  })
}

export async function populateTransactionsForExistingInventory() {
  try {
    const existingTransactions = await inventorySql`
      SELECT COUNT(*) as count FROM transaction_history
    `

    if (Number(existingTransactions[0].count) > 0) {
      return { success: true, skipped: true, count: existingTransactions[0].count }
    }

    const items = await getAllInventoryItems()
    let count = 0

    for (const item of items) {
      if (item.quantity > 0) {
        await addInventoryTransaction({
          item_type: item.name,
          quantity: item.quantity,
          transaction_type: "restock",
          notes: "Initial inventory",
          user_id: "system",
          price: item.avg_price || 0,
          total_cost: item.total_cost || 0,
        })
        count++
      }
    }

    return { success: true, skipped: false, count }
  } catch (error) {
    console.error("Error populating transactions:", error)
    throw error
  }
}
