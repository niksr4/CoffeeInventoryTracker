import { 
  users, type User, type InsertUser,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  transactions, type Transaction, type InsertTransaction,
  type TransactionWithItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Inventory item methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async getInventoryItemByName(name: string): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.name, name.toLowerCase()));
    return item;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventoryItems)
      .values({
        ...insertItem,
        name: insertItem.name.toLowerCase() // Ensure consistent casing for names
      })
      .returning();
    return item;
  }

  async updateInventoryItemQuantity(id: number, quantityChange: number): Promise<InventoryItem> {
    const item = await this.getInventoryItem(id);
    if (!item) {
      throw new Error(`Inventory item with id ${id} not found`);
    }

    const newQuantity = item.currentQuantity + quantityChange;
    
    if (newQuantity < 0) {
      throw new Error(`Cannot deplete more than available quantity of ${item.name}`);
    }
    
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ currentQuantity: newQuantity })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    return updatedItem;
  }

  // Transaction methods
  async getTransactions(): Promise<TransactionWithItem[]> {
    // First get all transactions
    const transactionsResult = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp));
    
    // Create the combined result
    const result: TransactionWithItem[] = [];
    
    for (const transaction of transactionsResult) {
      const item = await this.getInventoryItem(transaction.itemId);
      if (item) {
        result.push({
          id: transaction.id,
          itemId: transaction.itemId,
          itemName: item.name,
          quantity: transaction.quantity,
          unit: item.unit,
          transactionType: transaction.transactionType,
          notes: transaction.notes || undefined,
          userName: transaction.userName,
          timestamp: transaction.timestamp,
        });
      }
    }
    
    return result;
  }

  async getTransactionsByItemId(itemId: number): Promise<TransactionWithItem[]> {
    // First get all transactions for this item
    const transactionsResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.itemId, itemId))
      .orderBy(desc(transactions.timestamp));
    
    // Get the item
    const item = await this.getInventoryItem(itemId);
    if (!item) {
      return [];
    }
    
    // Map transactions to combined result
    return transactionsResult.map(transaction => ({
      id: transaction.id,
      itemId: transaction.itemId,
      itemName: item.name,
      quantity: transaction.quantity,
      unit: item.unit,
      transactionType: transaction.transactionType,
      notes: transaction.notes || undefined,
      userName: transaction.userName,
      timestamp: transaction.timestamp,
    }));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<TransactionWithItem> {
    // Insert the transaction
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    // Update inventory quantity
    const quantityChange = insertTransaction.transactionType === 'restocking' 
      ? insertTransaction.quantity 
      : -insertTransaction.quantity;
    
    const updatedItem = await this.updateInventoryItemQuantity(
      insertTransaction.itemId,
      quantityChange
    );
    
    // Return combined data
    return {
      ...transaction,
      itemName: updatedItem.name,
      unit: updatedItem.unit,
      notes: transaction.notes || undefined,
    };
  }
  
  // Initialize database with default inventory items if empty
  async initializeDatabase(): Promise<void> {
    const items = await this.getInventoryItems();
    
    if (items.length === 0) {
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
      
      for (const item of defaultItems) {
        await this.createInventoryItem(item);
      }
    }
  }
}