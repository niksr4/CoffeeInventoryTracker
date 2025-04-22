import { 
  users, type User, type InsertUser,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  transactions, type Transaction, type InsertTransaction,
  type TransactionWithItem
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Inventory item methods
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItemByName(name: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItemQuantity(id: number, quantityChange: number): Promise<InventoryItem>;
  
  // Transaction methods
  getTransactions(): Promise<TransactionWithItem[]>;
  getTransactionsByItemId(itemId: number): Promise<TransactionWithItem[]>;
  createTransaction(transaction: InsertTransaction): Promise<TransactionWithItem>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventoryItems: Map<number, InventoryItem>;
  private transactions: Map<number, Transaction>;
  
  private userId: number;
  private itemId: number;
  private transactionId: number;
  
  constructor() {
    this.users = new Map();
    this.inventoryItems = new Map();
    this.transactions = new Map();
    
    this.userId = 1;
    this.itemId = 1;
    this.transactionId = 1;
    
    // Initialize with default inventory items
    this.initializeInventoryItems();
  }
  
  private initializeInventoryItems() {
    const defaultItems = [
      { name: "diesel", currentQuantity: 120, unit: "L" },
      { name: "petrol", currentQuantity: 90, unit: "L" },
      { name: "urea", currentQuantity: 500, unit: "kg" },
      { name: "MOP", currentQuantity: 350, unit: "kg" },
      { name: "DAP", currentQuantity: 250, unit: "kg" },
      { name: "Glycil", currentQuantity: 75, unit: "L" },
      { name: "Tricel", currentQuantity: 50, unit: "L" },
      { name: "Contaf", currentQuantity: 30, unit: "L" },
      { name: "MgSO4", currentQuantity: 180, unit: "kg" }
    ];
    
    defaultItems.forEach(item => {
      this.createInventoryItem(item);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Inventory item methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }
  
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async getInventoryItemByName(name: string): Promise<InventoryItem | undefined> {
    return Array.from(this.inventoryItems.values()).find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
  }
  
  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.itemId++;
    const item: InventoryItem = { ...insertItem, id };
    this.inventoryItems.set(id, item);
    return item;
  }
  
  async updateInventoryItemQuantity(id: number, quantityChange: number): Promise<InventoryItem> {
    const item = this.inventoryItems.get(id);
    if (!item) {
      throw new Error(`Inventory item with id ${id} not found`);
    }
    
    const updatedItem = { 
      ...item, 
      currentQuantity: item.currentQuantity + quantityChange 
    };
    
    if (updatedItem.currentQuantity < 0) {
      throw new Error(`Cannot deplete more than available quantity of ${item.name}`);
    }
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // Transaction methods
  async getTransactions(): Promise<TransactionWithItem[]> {
    const transactions = Array.from(this.transactions.values());
    const transactionsWithItems: TransactionWithItem[] = [];
    
    for (const transaction of transactions) {
      const item = await this.getInventoryItem(transaction.itemId);
      if (item) {
        transactionsWithItems.push({
          ...transaction,
          itemName: item.name,
          unit: item.unit,
        });
      }
    }
    
    // Sort by timestamp, descending
    return transactionsWithItems.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  async getTransactionsByItemId(itemId: number): Promise<TransactionWithItem[]> {
    const transactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.itemId === itemId);
    
    const item = await this.getInventoryItem(itemId);
    if (!item) {
      return [];
    }
    
    return transactions.map(transaction => ({
      ...transaction,
      itemName: item.name,
      unit: item.unit,
    })).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<TransactionWithItem> {
    const id = this.transactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      timestamp: new Date() 
    };
    
    this.transactions.set(id, transaction);
    
    // Update inventory quantity
    const quantityChange = insertTransaction.transactionType === 'restocking' 
      ? insertTransaction.quantity 
      : -insertTransaction.quantity;
    
    const updatedItem = await this.updateInventoryItemQuantity(
      insertTransaction.itemId,
      quantityChange
    );
    
    return {
      ...transaction,
      itemName: updatedItem.name,
      unit: updatedItem.unit,
    };
  }
}

// Use DatabaseStorage instead of MemStorage for persistent storage
import { DatabaseStorage } from "./storage-db";

export const storage = new DatabaseStorage();

// Initialize the database with default items if needed
storage.initializeDatabase().catch(error => {
  console.error("Failed to initialize database:", error);
});
