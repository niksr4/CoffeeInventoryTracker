import { redis, KEYS, checkRedisConnection, getRedisAvailability, setRedisAvailability } from "./redis"

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
  price?: number // Price per unit for restocking transactions
  totalCost?: number // Total cost (quantity * price) for restocking transactions
}

// Default inventory items - ONLY used for first-time initialization
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
  { name: "Rock phosphate", quantity: 0, unit: "kg" },
  { name: "Micromin", quantity: 0, unit: "kg" },
  { name: "Fix", quantity: 0, unit: "L" },
  { name: "Gramaxone", quantity: 0, unit: "L" },
  { name: "Polyhalite", quantity: 0, unit: "kg" },
]

// Local storage fallbacks (for server-side)
let localTransactions: Transaction[] = []
let localLastUpdate = Date.now()
let hasInitializedData = false // Flag to track if we've already initialized data

// Helper function to get data from localStorage (client-side only)
function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Helper function to save data to localStorage (client-side only)
function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Function to get all transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  // Try Redis first if available
  if (redis && getRedisAvailability()) {
    try {
      const transactions = await redis.get<Transaction[]>(KEYS.TRANSACTIONS)
      if (transactions) {
        // Update local cache
        localTransactions = transactions
        if (typeof window !== "undefined") {
          saveToLocalStorage("inventoryTransactions", transactions)
        }
        return transactions
      }
    } catch (error) {
      console.error("Error getting transactions from Redis:", error)
      setRedisAvailability(false)
    }
  }

  // Fallback to localStorage or memory
  if (typeof window !== "undefined") {
    return getFromLocalStorage("inventoryTransactions", localTransactions)
  }

  return localTransactions
}

// Function to save transactions
export async function saveTransactions(transactions: Transaction[]): Promise<boolean> {
  // Update local cache first
  localTransactions = transactions
  localLastUpdate = Date.now()

  if (typeof window !== "undefined") {
    saveToLocalStorage("inventoryTransactions", transactions)
    saveToLocalStorage("inventoryLastUpdate", localLastUpdate)
  }

  // Try Redis if available
  if (redis && getRedisAvailability()) {
    try {
      await redis.set(KEYS.TRANSACTIONS, transactions)
      await redis.set(KEYS.LAST_UPDATE, localLastUpdate)
      return true
    } catch (error) {
      console.error("Error saving transactions to Redis:", error)
      setRedisAvailability(false)
      return false
    }
  }

  return true // Return true since we saved to local storage
}

// Function to get all inventory items
export async function getAllInventoryItems(includeZeroQuantity = true): Promise<InventoryItem[]> {
  // Get all transactions
  const transactions = await getAllTransactions()

  // If no transactions, return empty array (not default items)
  // This ensures we don't reset inventory on every deployment
  if (transactions.length === 0) {
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

// Function to add a transaction
export async function addTransaction(transaction: Transaction): Promise<boolean> {
  // Get current transactions
  const transactions = await getAllTransactions()

  // Add new transaction at the beginning
  const updatedTransactions = [transaction, ...transactions]

  // Save updated transactions
  return saveTransactions(updatedTransactions)
}

// Function to get the last update timestamp
export async function getLastUpdateTimestamp(): Promise<number> {
  // Try Redis first if available
  if (redis && getRedisAvailability()) {
    try {
      const timestamp = await redis.get<number>(KEYS.LAST_UPDATE)
      if (timestamp) {
        localLastUpdate = timestamp
        if (typeof window !== "undefined") {
          saveToLocalStorage("inventoryLastUpdate", timestamp)
        }
        return timestamp
      }
    } catch (error) {
      console.error("Error getting last update timestamp from Redis:", error)
      setRedisAvailability(false)
    }
  }

  // Fallback to localStorage or memory
  if (typeof window !== "undefined") {
    return getFromLocalStorage("inventoryLastUpdate", localLastUpdate)
  }

  return localLastUpdate
}

// Function to perform batch operation
export async function performBatchOperation(newTransactions: Transaction[]): Promise<boolean> {
  // Simply save the transactions
  return saveTransactions(newTransactions)
}

// CRITICAL CHANGE: Only initialize if data doesn't exist in Redis
// This ensures we don't reset inventory on every deployment
export async function initializeDefaultDataIfEmpty(): Promise<boolean> {
  // Skip if we've already checked this session
  if (hasInitializedData) {
    return false
  }

  // Only check Redis if it's available
  if (redis && getRedisAvailability()) {
    try {
      // Check if transactions exist in Redis
      const redisTransactions = await redis.get<Transaction[]>(KEYS.TRANSACTIONS)

      // If transactions exist in Redis, DO NOT initialize
      if (redisTransactions && redisTransactions.length > 0) {
        console.log("Data already exists in Redis, skipping initialization")
        hasInitializedData = true
        return false
      }
    } catch (error) {
      console.error("Error checking Redis data:", error)
      // Continue to check local data
    }
  }

  // Check if transactions exist in local storage
  const transactions = await getAllTransactions()

  // If transactions exist in local storage, DO NOT initialize
  if (transactions.length > 0) {
    console.log("Data already exists in local storage, skipping initialization")
    hasInitializedData = true
    return false
  }

  console.log("No existing data found. Initializing with default data.")

  // Create initial transactions from default items
  const initialTransactions = defaultInventoryItems.map((item) => ({
    id: `init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    itemType: item.name,
    quantity: item.quantity,
    transactionType: "Restocking" as const,
    notes: "Initial system setup",
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

  // Save the initial transactions
  const success = await saveTransactions(initialTransactions)
  hasInitializedData = true
  return success
}

// Function to check if data exists
export async function checkIfDataExists(): Promise<boolean> {
  // Check Redis if available
  if (redis && getRedisAvailability()) {
    try {
      const redisTransactions = await redis.get<Transaction[]>(KEYS.TRANSACTIONS)
      if (redisTransactions && redisTransactions.length > 0) {
        return true
      }
    } catch (error) {
      console.error("Error checking Redis data:", error)
    }
  }

  // Check local storage
  const transactions = await getAllTransactions()
  return transactions.length > 0
}

// Function to check storage status
export async function checkStorageStatus(): Promise<{
  redisAvailable: boolean
  transactionsCount: number
  inventoryCount: number
  lastUpdate: number
  hasExistingData: boolean
}> {
  // Check Redis connection
  const redisAvailable = await checkRedisConnection()

  // Get data
  const transactions = await getAllTransactions()
  const inventory = await getAllInventoryItems()
  const lastUpdate = await getLastUpdateTimestamp()
  const hasExistingData = await checkIfDataExists()

  return {
    redisAvailable,
    transactionsCount: transactions.length,
    inventoryCount: inventory.length,
    lastUpdate,
    hasExistingData,
  }
}
