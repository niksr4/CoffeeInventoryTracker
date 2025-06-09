import { redis, KEYS, safeRedisOperation } from "./redis"

export type InventoryItem = {
  name: string
  quantity: number
  unit: string
}

export type Transaction = {
  id: string
  itemType: string
  quantity: number
  transactionType: "Depleting" | "Restocking" | "Item Deleted" | "Unit Change"
  notes: string
  date: string
  user: string
  unit: string
}

// Default inventory items to use if no data is found
const defaultInventoryItems = [
  { name: "UREA", quantity: 7130, unit: "kg" },
  { name: "MOP", quantity: 3050, unit: "kg" },
  { name: "DAP", quantity: 3350, unit: "kg" },
  { name: "MOP white", quantity: 13200, unit: "kg" },
  { name: "MgSO4", quantity: 3475, unit: "kg" },
  { name: "MOP+UREA Mix", quantity: 12, unit: "bags" },
  { name: "Phosphoric Acid", quantity: 50, unit: "L" },
  { name: "Tricel", quantity: 35, unit: "L" },
  { name: "Glycil", quantity: 120, unit: "L" },
  { name: "Neem oil", quantity: 5, unit: "L" },
  { name: "19:19:19", quantity: 200, unit: "kg" },
  { name: "Zinc", quantity: 10, unit: "L" },
  { name: "Contaf", quantity: 20, unit: "L" },
  { name: "NPK Potassium Nitrate", quantity: 50, unit: "kg" },
  { name: "Solubor", quantity: 2, unit: "kg" },
  { name: "H.S.D", quantity: 20, unit: "L" },
  { name: "Petrol", quantity: 25, unit: "L" },
]

// Function to get all transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")
      const transactions = await redis.get<Transaction[]>(KEYS.TRANSACTIONS)
      return transactions || []
    },
    [], // Return empty array as fallback
  )
}

// Function to save transactions
export async function saveTransactions(transactions: Transaction[]): Promise<boolean> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")
      await redis.set(KEYS.TRANSACTIONS, transactions)
      await redis.set(KEYS.LAST_UPDATE, Date.now())
      return true
    },
    false, // Return false as fallback
  )
}

// Function to add a new transaction and update inventory
export async function addTransaction(transaction: Transaction): Promise<boolean> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")

      // Get current transactions
      const transactions = await getAllTransactions()

      // Add new transaction at the beginning
      const updatedTransactions = [transaction, ...transactions]

      // Save updated transactions
      await redis.set(KEYS.TRANSACTIONS, updatedTransactions)

      // Update inventory based on the transaction
      await updateInventoryFromTransaction(transaction)

      // Update last update timestamp
      await redis.set(KEYS.LAST_UPDATE, Date.now())

      return true
    },
    false, // Return false as fallback
  )
}

// Function to update inventory based on a transaction
async function updateInventoryFromTransaction(transaction: Transaction): Promise<void> {
  return safeRedisOperation(async () => {
    if (!redis) throw new Error("Redis client not initialized")

    const { itemType, quantity, transactionType, unit } = transaction

    // Get current quantity from Redis hash
    const currentQuantity = Number.parseInt((await redis.hget(KEYS.INVENTORY_HASH, `${itemType}:quantity`)) || "0")
    const currentUnit = (await redis.hget(KEYS.INVENTORY_HASH, `${itemType}:unit`)) || unit

    // Calculate new quantity based on transaction type
    let newQuantity = currentQuantity
    if (transactionType === "Restocking") {
      newQuantity += quantity
    } else if (transactionType === "Depleting") {
      newQuantity = Math.max(0, currentQuantity - quantity)
    } else if (transactionType === "Item Deleted") {
      // For item deletion, we'll set quantity to 0
      newQuantity = 0
    }

    // Update inventory in Redis hash
    await redis.hset(KEYS.INVENTORY_HASH, {
      [`${itemType}:quantity`]: newQuantity,
      [`${itemType}:unit`]: unit,
    })
  }, undefined)
}

// Function to get all inventory items
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")

      // Get all fields from the inventory hash
      const inventoryHash = await redis.hgetall(KEYS.INVENTORY_HASH)

      if (!inventoryHash) return []

      // Process the hash into inventory items
      const items: Record<string, Partial<InventoryItem>> = {}

      // Process each key in the hash
      for (const key in inventoryHash) {
        const [itemName, field] = key.split(":")

        if (!items[itemName]) {
          items[itemName] = { name: itemName }
        }

        if (field === "quantity") {
          items[itemName].quantity = Number.parseInt(inventoryHash[key])
        } else if (field === "unit") {
          items[itemName].unit = inventoryHash[key]
        }
      }

      // Convert to array and filter out incomplete items
      return Object.values(items)
        .filter(
          (item): item is InventoryItem =>
            item.name !== undefined && item.quantity !== undefined && item.unit !== undefined,
        )
        .filter((item) => item.quantity > 0) // Only include items with quantity > 0
    },
    [], // Return empty array as fallback
  )
}

// Function to rebuild inventory from transactions
export async function rebuildInventoryFromTransactions(): Promise<boolean> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")

      // Get all transactions
      const transactions = await getAllTransactions()

      // Clear current inventory
      await redis.del(KEYS.INVENTORY_HASH)

      // Process transactions in chronological order (oldest first)
      for (const transaction of [...transactions].reverse()) {
        await updateInventoryFromTransaction(transaction)
      }

      return true
    },
    false, // Return false as fallback
  )
}

// Function to get the last update timestamp
export async function getLastUpdateTimestamp(): Promise<number> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")
      const timestamp = await redis.get<number>(KEYS.LAST_UPDATE)
      return timestamp || Date.now()
    },
    Date.now(), // Return current timestamp as fallback
  )
}

// Function to perform batch operations atomically
export async function performBatchOperation(newTransactions: Transaction[]): Promise<boolean> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")

      // Set transactions
      await redis.set(KEYS.TRANSACTIONS, newTransactions)

      // Clear current inventory
      await redis.del(KEYS.INVENTORY_HASH)

      // Update last update timestamp
      const timestamp = Date.now()
      await redis.set(KEYS.LAST_UPDATE, timestamp)

      // Rebuild inventory from transactions
      await rebuildInventoryFromTransactions()

      return true
    },
    false, // Return false as fallback
  )
}

// Function to initialize with default data if empty
export async function initializeDefaultDataIfEmpty(): Promise<boolean> {
  return safeRedisOperation(
    async () => {
      if (!redis) throw new Error("Redis client not initialized")

      // Check if transactions exist
      const transactions = await getAllTransactions()

      // If transactions exist, don't initialize
      if (transactions.length > 0) {
        return false
      }

      // Create initial transactions from default items
      const initialTransactions = defaultInventoryItems.map((item) => ({
        id: `init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        itemType: item.name,
        quantity: item.quantity,
        transactionType: "Restocking" as const,
        notes: "Initial system setup",
        date: new Date().toISOString(),
        user: "system",
        unit: item.unit,
      }))

      // Perform batch operation to set up initial data
      return performBatchOperation(initialTransactions)
    },
    false, // Return false as fallback
  )
}
