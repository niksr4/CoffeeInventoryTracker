import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define inventory items schema
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  currentQuantity: integer("current_quantity").notNull().default(0),
  unit: text("unit").notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  name: true,
  currentQuantity: true,
  unit: true,
});

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Define transactions schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  transactionType: text("transaction_type").notNull(), // "depleting" or "restocking"
  notes: text("notes"),
  userName: text("user_name").notNull().default("System"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  itemId: true,
  quantity: true,
  transactionType: true,
  notes: true,
  userName: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Combined transaction data with item info
export type TransactionWithItem = {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  transactionType: string;
  notes?: string;
  userName: string;
  timestamp: Date;
};
