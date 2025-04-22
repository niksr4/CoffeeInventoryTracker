import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTransactionSchema } from "@shared/schema";
import { setupAuth, initializeUsers } from "./auth";

// Middleware to require authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to require admin role
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Access denied" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Initialize default users
  await initializeUsers();
  // Get all inventory items
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });
  
  // Get all transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const itemType = req.query.itemType as string;
      
      let transactions;
      if (itemType && itemType !== "all") {
        const item = await storage.getInventoryItemByName(itemType);
        if (item) {
          transactions = await storage.getTransactionsByItemId(item.id);
        } else {
          transactions = [];
        }
      } else {
        transactions = await storage.getTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Create a new transaction
  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      // Extend the schema with additional validation
      const transactionSchema = insertTransactionSchema.extend({
        quantity: z.number().positive("Quantity must be positive"),
        transactionType: z.enum(["depleting", "restocking"], {
          errorMap: () => ({ message: "Transaction type must be 'depleting' or 'restocking'" })
        }),
      });
      
      // Validate request body
      const validatedData = transactionSchema.parse(req.body);
      
      // Create transaction
      const transaction = await storage.createTransaction(validatedData);
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const formatted = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        res.status(400).json({ errors: formatted });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });
  
  // Export transactions (CSV format)
  app.get("/api/export", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      
      // Create CSV content
      let csvContent = "Date,Item Type,Quantity,Transaction Type,Notes,User\n";
      
      transactions.forEach(t => {
        const date = t.timestamp.toISOString().split('T')[0];
        const time = t.timestamp.toTimeString().split(' ')[0];
        csvContent += `${date} ${time},${t.itemName},${t.quantity} ${t.unit},${t.transactionType},${t.notes || ""},${t.userName}\n`;
      });
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory-transactions.csv');
      
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
