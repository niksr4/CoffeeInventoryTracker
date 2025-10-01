// This file now acts as a compatibility layer that redirects to Neon storage
import {
  getAllTransactions as getNeonTransactions,
  addTransaction as addNeonTransaction,
  getAllInventoryItems as getNeonInventoryItems,
  performBatchOperation as performNeonBatchOperation,
  getLastUpdateTimestamp as getNeonLastUpdateTimestamp,
  initializeDefaultDataIfEmpty as initializeNeonDefaultData,
  checkIfDataExists as checkNeonDataExists,
} from "./neon-inventory-storage"

export type { Transaction, InventoryItem } from "./neon-inventory-storage"

// Re-export all functions to point to Neon storage
export const getAllTransactions = getNeonTransactions
export const addTransaction = addNeonTransaction
export const getAllInventoryItems = getNeonInventoryItems
export const performBatchOperation = performNeonBatchOperation
export const getLastUpdateTimestamp = getNeonLastUpdateTimestamp
export const initializeDefaultDataIfEmpty = initializeNeonDefaultData
export const checkIfDataExists = checkNeonDataExists
