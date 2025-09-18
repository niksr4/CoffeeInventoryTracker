import { redis, safeRedisOperation } from "./redis"
import { getTenantKey, getCurrentTenant } from "./tenant"
import type { InventoryItem, Transaction } from "./storage"

// Tenant-aware Redis keys
export const TENANT_KEYS = {
  TRANSACTIONS: "transactions",
  INVENTORY_HASH: "inventory:items",
  LAST_UPDATE: "inventory:lastUpdate",
  LABOR_DEPLOYMENTS: "labor:deployments",
  CONSUMABLE_DEPLOYMENTS: "consumable:deployments",
}

// Function to get all transactions for current tenant
export async function getTenantTransactions(): Promise<Transaction[]> {
  const tenant = getCurrentTenant()
  if (!tenant) {
    console.warn("No tenant context available, returning empty transactions array")
    return []
  }

  const tenantKey = getTenantKey(TENANT_KEYS.TRANSACTIONS)

  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")
      const transactions = await redis.get<Transaction[]>(tenantKey)
      return transactions || []
    },
    [], // Return empty array as fallback
  )
}

// Function to save transactions for current tenant
export async function saveTenantTransactions(transactions: Transaction[]): Promise<boolean> {
  const tenant = getCurrentTenant()
  if (!tenant) {
    throw new Error("No tenant context available")
  }

  const tenantKey = getTenantKey(TENANT_KEYS.TRANSACTIONS)
  const lastUpdateKey = getTenantKey(TENANT_KEYS.LAST_UPDATE)

  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")
      await redis.set(tenantKey, transactions)
      await redis.set(lastUpdateKey, Date.now())
      return true
    },
    false, // Return false as fallback
  )
}

// Function to add a transaction for current tenant
export async function addTenantTransaction(transaction: Transaction): Promise<boolean> {
  const transactions = await getTenantTransactions()
  const updatedTransactions = [transaction, ...transactions]
  return saveTenantTransactions(updatedTransactions)
}

// Function to get inventory items for current tenant
export async function getTenantInventoryItems(includeZeroQuantity = true): Promise<InventoryItem[]> {
  const tenant = getCurrentTenant()
  if (!tenant) {
    console.warn("No tenant context available, returning empty inventory array")
    return []
  }

  const transactions = await getTenantTransactions()

  if (!transactions || transactions.length === 0) {
    return []
  }

  // Calculate inventory from transactions
  const inventory: Record<string, InventoryItem> = {}

  // Process transactions in chronological order (oldest first)
  for (const transaction of [...transactions].reverse()) {
    const { itemType, quantity, transactionType, unit } = transaction

    // Initialize item if it doesn't exist
    if (!inventory[itemType]) {
      inventory[itemType] = {
        name: itemType,
        quantity: 0,
        unit: unit,
      }
    }

    // Update quantity based on transaction type
    if (transactionType === "Restocking") {
      inventory[itemType].quantity += quantity
    } else if (transactionType === "Depleting") {
      inventory[itemType].quantity = Math.max(0, inventory[itemType].quantity - quantity)
    } else if (transactionType === "Item Deleted") {
      inventory[itemType].quantity = 0
    } else if (transactionType === "Unit Change") {
      inventory[itemType].unit = unit
    }
  }

  // Convert to array and optionally filter out items with zero quantity
  const items = Object.values(inventory)
  return includeZeroQuantity ? items : items.filter((item) => item.quantity > 0)
}

// Function to get last update timestamp for current tenant
export async function getTenantLastUpdate(): Promise<number> {
  const tenant = getCurrentTenant()
  if (!tenant) {
    console.warn("No tenant context available, returning current timestamp")
    return Date.now()
  }

  const lastUpdateKey = getTenantKey(TENANT_KEYS.LAST_UPDATE)

  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")
      const timestamp = await redis.get<number>(lastUpdateKey)
      return timestamp || Date.now()
    },
    Date.now(), // Return current timestamp as fallback
  )
}

// Function to perform batch operations for current tenant
export async function performTenantBatchOperation(newTransactions: Transaction[]): Promise<boolean> {
  return saveTenantTransactions(newTransactions)
}

// Function to check if tenant has existing data
export async function checkTenantDataExists(): Promise<boolean> {
  const transactions = await getTenantTransactions()
  return transactions.length > 0
}

// Function to initialize default data for a new tenant
export async function initializeTenantDefaultData(): Promise<boolean> {
  const hasData = await checkTenantDataExists()
  if (hasData) {
    return false // Data already exists
  }

  // Default inventory items for new tenants
  const defaultItems = [
    { name: "Honey Jars (500ml)", quantity: 100, unit: "units" },
    { name: "Honey Jars (250ml)", quantity: 150, unit: "units" },
    { name: "Beeswax", quantity: 25, unit: "kg" },
    { name: "Propolis", quantity: 5, unit: "kg" },
    { name: "Bee Pollen", quantity: 10, unit: "kg" },
  ]

  const initialTransactions = defaultItems.map((item) => ({
    id: `init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    itemType: item.name,
    quantity: item.quantity,
    transactionType: "Restocking" as const,
    notes: "Initial inventory setup",
    date:
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    user: "system",
    unit: item.unit,
  }))

  return saveTenantTransactions(initialTransactions)
}

// Function to get tenant storage status
export async function getTenantStorageStatus() {
  const tenant = getCurrentTenant()
  if (!tenant) {
    throw new Error("No tenant context available")
  }

  const transactions = await getTenantTransactions()
  const inventory = await getTenantInventoryItems()
  const lastUpdate = await getTenantLastUpdate()
  const hasExistingData = await checkTenantDataExists()

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    transactionsCount: transactions.length,
    inventoryCount: inventory.length,
    lastUpdate,
    hasExistingData,
  }
}
