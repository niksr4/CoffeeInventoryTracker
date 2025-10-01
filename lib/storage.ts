// Storage layer - redirects to Neon
import { inventorySql } from "./neon-connections"
import {
  getAllInventoryItems as neonGetAllInventoryItems,
  getAllTransactions as neonGetAllTransactions,
  getLastUpdateTimestamp as neonGetLastUpdateTimestamp,
  initializeDefaultDataIfEmpty as neonInitializeDefaultDataIfEmpty,
  checkIfDataExists as neonCheckIfDataExists,
  performBatchOperation as neonPerformBatchOperation,
} from "./neon-inventory-storage"

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

export interface InventoryItem {
  name: string
  quantity: number
  unit: string
  avg_price?: number
  total_cost?: number
}

// Get all transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  return neonGetAllTransactions()
}

// Get all inventory items
export async function getAllInventoryItems(includeZero = true): Promise<InventoryItem[]> {
  return neonGetAllInventoryItems(includeZero)
}

// Add a transaction
export async function addTransaction(transaction: Transaction): Promise<boolean> {
  try {
    const total_cost = transaction.quantity * (transaction.price || 0)

    await inventorySql`
      INSERT INTO transaction_history (
        item_type, quantity, transaction_type, notes, user_id, price, total_cost
      )
      VALUES (
        ${transaction.item_type},
        ${transaction.quantity},
        ${transaction.transaction_type},
        ${transaction.notes || ""},
        ${transaction.user_id},
        ${transaction.price || 0},
        ${total_cost}
      )
    `

    return true
  } catch (error) {
    console.error("Error adding transaction:", error)
    return false
  }
}

// Perform batch operation
export async function performBatchOperation(transactions: Transaction[]): Promise<boolean> {
  return neonPerformBatchOperation(transactions)
}

// Get last update timestamp
export async function getLastUpdateTimestamp(): Promise<number> {
  return neonGetLastUpdateTimestamp()
}

// Check if data exists
export async function checkIfDataExists(): Promise<boolean> {
  return neonCheckIfDataExists()
}

// Initialize default data if empty
export async function initializeDefaultDataIfEmpty(): Promise<void> {
  const hasData = await checkIfDataExists()
  if (!hasData) {
    console.log("No data found, initializing with default inventory...")
    neonInitializeDefaultDataIfEmpty()
  }
}
