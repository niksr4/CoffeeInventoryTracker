import { accountsSql, inventorySql } from "./neon-connections"

export interface InventoryItem {
  name: string
  quantity: number
  unit: string
}

export interface Transaction {
  id: string
  itemType: string
  quantity: number
  transactionType: "Depleting" | "Restocking" | "Item Deleted" | "Unit Change"
  notes: string
  date: string
  user: string
  unit: string
  price?: number
  totalCost?: number
}

export interface LaborEntry {
  laborCount: number
  costPerLabor: number
}

export interface LaborDeployment {
  id: string
  code: string
  reference: string
  laborEntries: LaborEntry[]
  totalCost: number
  date: string
  user: string
  notes?: string
}

export interface ConsumableDeployment {
  id: string
  date: string
  code: string
  reference: string
  amount: number
  notes?: string
  user: string
}

export async function initializeTables() {
  try {
    await accountsSql`
      CREATE TABLE IF NOT EXISTS transaction_history (
        id SERIAL PRIMARY KEY,
        item_type VARCHAR(100) NOT NULL,
        quantity NUMERIC NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        notes TEXT,
        transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(50) NOT NULL,
        price NUMERIC,
        total_cost NUMERIC
      )
    `

    await accountsSql`
      CREATE TABLE IF NOT EXISTS labor_transactions (
        id SERIAL PRIMARY KEY,
        transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        activity_code VARCHAR(50) NOT NULL,
        total_cost NUMERIC NOT NULL,
        notes TEXT,
        user_id VARCHAR(50) NOT NULL
      )
    `

    await accountsSql`
      CREATE TABLE IF NOT EXISTS expense_transactions (
        id SERIAL PRIMARY KEY,
        transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        activity_code VARCHAR(50) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        total_cost NUMERIC NOT NULL,
        notes TEXT,
        user_id VARCHAR(50) NOT NULL
      )
    `

    console.log("✅ Neon tables initialized")
    return { success: true }
  } catch (error) {
    console.error("❌ Failed to initialize tables:", error)
    throw error
  }
}

export async function bulkImportTransactions(
  transactions: Transaction[],
): Promise<{ success: boolean; imported: number }> {
  try {
    let imported = 0

    for (const transaction of transactions) {
      await accountsSql`
        INSERT INTO transaction_history (
          item_type, quantity, transaction_type, notes, transaction_date, user_id, price, total_cost
        ) VALUES (
          ${transaction.itemType},
          ${transaction.quantity},
          ${transaction.transactionType},
          ${transaction.notes},
          ${transaction.date},
          ${transaction.user},
          ${transaction.price || 0},
          ${transaction.totalCost || 0}
        )
        ON CONFLICT DO NOTHING
      `
      imported++
    }

    return { success: true, imported }
  } catch (error) {
    console.error("Error importing transactions:", error)
    return { success: false, imported: 0 }
  }
}

export async function bulkImportConsumables(
  deployments: ConsumableDeployment[],
): Promise<{ success: boolean; imported: number }> {
  try {
    let imported = 0

    for (const deployment of deployments) {
      await accountsSql`
        INSERT INTO expense_transactions (transaction_date, activity_code, transaction_type, total_cost, notes, user_id)
        VALUES (
          ${deployment.date}, 
          ${deployment.code},
          'consumable',
          ${deployment.amount}, 
          ${deployment.notes || deployment.reference}, 
          ${deployment.user}
        )
        ON CONFLICT DO NOTHING
      `
      imported++
    }

    return { success: true, imported }
  } catch (error) {
    console.error("Error importing consumables:", error)
    return { success: false, imported: 0 }
  }
}

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  try {
    const result = await inventorySql`
      SELECT 
        item_type as name,
        quantity,
        unit
      FROM current_inventory
      WHERE quantity > 0
      ORDER BY item_type
    `

    return result.map((row: any) => ({
      name: String(row.name),
      quantity: Number(row.quantity) || 0,
      unit: String(row.unit || "kg"),
    }))
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return []
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const result = await accountsSql`
      SELECT 
        id::text,
        item_type as "itemType",
        quantity,
        transaction_type as "transactionType",
        notes,
        transaction_date::text as date,
        user_id as "user",
        price,
        total_cost as "totalCost"
      FROM transaction_history 
      ORDER BY transaction_date DESC
    `

    return result.map((row: any) => ({
      id: String(row.id),
      itemType: String(row.itemType),
      quantity: Number(row.quantity) || 0,
      transactionType: String(row.transactionType) as any,
      notes: row.notes ? String(row.notes) : "",
      date: String(row.date),
      user: String(row.user),
      unit: "kg",
      price: Number(row.price) || 0,
      totalCost: Number(row.totalCost) || 0,
    }))
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

export async function addTransaction(transaction: Transaction): Promise<boolean> {
  try {
    await accountsSql`
      INSERT INTO transaction_history (
        item_type, quantity, transaction_type, notes, transaction_date, user_id, price, total_cost
      ) VALUES (
        ${transaction.itemType},
        ${transaction.quantity},
        ${transaction.transactionType},
        ${transaction.notes},
        ${transaction.date},
        ${transaction.user},
        ${transaction.price || 0},
        ${transaction.totalCost || 0}
      )
    `
    return true
  } catch (error) {
    console.error("Error adding transaction:", error)
    return false
  }
}

export async function performBatchOperation(newTransactions: Transaction[]): Promise<boolean> {
  try {
    await accountsSql`DELETE FROM transaction_history`

    for (const transaction of newTransactions) {
      await addTransaction(transaction)
    }

    return true
  } catch (error) {
    console.error("Error performing batch operation:", error)
    return false
  }
}

export async function getAllLaborDeployments(): Promise<LaborDeployment[]> {
  try {
    const result = await accountsSql`
      SELECT 
        id::text,
        transaction_date::text as date,
        activity_code as code,
        activity_code as reference,
        notes,
        total_cost as "totalCost",
        user_id as "user"
      FROM labor_transactions
      ORDER BY transaction_date DESC
    `

    return result.map((row: any) => ({
      id: String(row.id),
      code: String(row.code || ""),
      reference: String(row.reference || ""),
      laborEntries: [
        {
          laborCount: 1,
          costPerLabor: Number(row.totalCost) || 0,
        },
      ],
      totalCost: Number(row.totalCost) || 0,
      date: String(row.date),
      user: String(row.user || "system"),
      notes: row.notes ? String(row.notes) : "",
    }))
  } catch (error) {
    console.error("Error fetching labor deployments:", error)
    return []
  }
}

export async function addLaborDeployment(deployment: Omit<LaborDeployment, "id">): Promise<boolean> {
  try {
    await accountsSql`
      INSERT INTO labor_transactions (transaction_date, activity_code, total_cost, notes, user_id)
      VALUES (
        ${deployment.date}, 
        ${deployment.code},
        ${deployment.totalCost}, 
        ${deployment.notes || deployment.reference}, 
        ${deployment.user}
      )
    `

    return true
  } catch (error) {
    console.error("Error adding labor deployment:", error)
    return false
  }
}

export async function getAllConsumableDeployments(): Promise<ConsumableDeployment[]> {
  try {
    const result = await accountsSql`
      SELECT 
        id::text,
        transaction_date::text as date,
        activity_code as code,
        activity_code as reference,
        notes,
        total_cost as amount,
        user_id as "user"
      FROM expense_transactions
      WHERE transaction_type = 'consumable'
      ORDER BY transaction_date DESC
    `

    return result.map((row: any) => ({
      id: String(row.id),
      date: String(row.date),
      code: String(row.code || ""),
      reference: String(row.reference || ""),
      amount: Number(row.amount) || 0,
      notes: row.notes ? String(row.notes) : "",
      user: String(row.user || "system"),
    }))
  } catch (error) {
    console.error("Error fetching consumable deployments:", error)
    return []
  }
}

export async function addConsumableDeployment(deployment: Omit<ConsumableDeployment, "id">): Promise<boolean> {
  try {
    await accountsSql`
      INSERT INTO expense_transactions (transaction_date, activity_code, transaction_type, total_cost, notes, user_id)
      VALUES (
        ${deployment.date}, 
        ${deployment.code},
        'consumable',
        ${deployment.amount}, 
        ${deployment.notes || deployment.reference}, 
        ${deployment.user}
      )
    `

    return true
  } catch (error) {
    console.error("Error adding consumable deployment:", error)
    return false
  }
}

export async function checkNeonConnection(): Promise<boolean> {
  try {
    await accountsSql`SELECT 1`
    await inventorySql`SELECT 1`
    return true
  } catch (error) {
    console.error("Neon connection failed:", error)
    return false
  }
}

export async function getLastUpdateTimestamp(): Promise<number> {
  try {
    const result = await accountsSql`
      SELECT MAX(transaction_date) as last_update 
      FROM transaction_history
    `
    return result[0]?.last_update ? new Date(result[0].last_update).getTime() : Date.now()
  } catch (error) {
    console.error("Error getting last update timestamp:", error)
    return Date.now()
  }
}
