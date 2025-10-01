// This file now uses Neon database exclusively
import {
  getAllTransactions,
  addTransaction,
  getAllInventoryItems,
  performBatchOperation,
  getLastUpdateTimestamp,
  initializeDefaultDataIfEmpty,
} from "./neon-inventory-storage"

export type { Transaction, InventoryItem } from "./neon-inventory-storage"

// Re-export all functions
export {
  getAllTransactions,
  addTransaction,
  getAllInventoryItems,
  performBatchOperation,
  getLastUpdateTimestamp,
  initializeDefaultDataIfEmpty,
}
