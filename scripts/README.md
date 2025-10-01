# Neon Database Setup Instructions

## 📋 Overview

This folder contains all the SQL scripts needed to set up your Coffee Inventory Tracker database directly in Neon PostgreSQL.

## 🚀 Quick Start

### Step 1: Prepare Your Data

1. Rename your files:
   - `accounts.txt` → `accounts.json`
   - `inventory.txt` → `inventory.json`

2. Make sure they contain valid JSON arrays

### Step 2: Generate SQL Scripts

Run the Node.js generator locally:

\`\`\`bash
node generate-sql-inserts.js
\`\`\`

This will create two files:
- `02-import-consumables-full.sql`
- `03-import-inventory-full.sql`

### Step 3: Run in Neon

1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Open the **SQL Editor**
4. Run the scripts in this order:

#### 3a. Create Tables
\`\`\`sql
-- Copy and paste contents of 01-create-tables.sql
\`\`\`

#### 3b. Import Consumables
\`\`\`sql
-- Copy and paste contents of 02-import-consumables-full.sql
\`\`\`

#### 3c. Import Inventory
\`\`\`sql
-- Copy and paste contents of 03-import-inventory-full.sql
\`\`\`

#### 3d. Verify Data
\`\`\`sql
-- Copy and paste contents of 04-useful-queries.sql
\`\`\`

## 📊 What Gets Created

### Tables

1. **inventory_transactions**
   - Stores all inventory movements (restocking, depleting, etc.)
   - Tracks quantities, prices, and transaction history

2. **labor_consumables**
   - Stores consumable expenses
   - Tracks labor deployments
   - Links to category codes

### Views

1. **current_inventory**
   - Real-time inventory levels
   - Calculated from all transactions

2. **consumable_expenses_by_category**
   - Expense summary by category code
   - Total costs and transaction counts

3. **monthly_expenses**
   - Monthly breakdown of expenses
   - Useful for budgeting and reporting

### Indexes

- Fast lookups by item name
- Fast date-based queries
- Optimized for category searches

## ✅ Verification

After importing, verify your data:

\`\`\`sql
-- Check consumables
SELECT COUNT(*) FROM labor_consumables WHERE type = 'consumable';

-- Check inventory
SELECT COUNT(*) FROM inventory_transactions;

-- View current inventory
SELECT * FROM current_inventory;

-- Check total expenses
SELECT SUM(cost) FROM labor_consumables WHERE type = 'consumable';
\`\`\`

## 🔧 Troubleshooting

### "Syntax error" when running SQL
- Make sure you copied the entire script
- Check for missing semicolons
- Verify quote marks aren't converted by your editor

### "Duplicate key" errors
- The scripts use `ON CONFLICT DO NOTHING`
- This is safe - it means data already exists
- You can run imports multiple times

### Data looks wrong
- Check your JSON files are valid
- Verify dates are in the correct format
- Run the verification queries in step 3d

## 📝 Notes

- All dates are stored as TEXT for compatibility
- Transaction IDs are preserved from original data
- Prices and costs use DECIMAL for accuracy
- User IDs are stored as TEXT

## 🎯 Next Steps

Once data is imported:

1. Connect your app to Neon using `DATABASE_URL`
2. Use the provided views for quick reporting
3. Run the useful queries to explore your data
4. Set up regular backups in Neon dashboard

## 💡 Tips

- Use the SQL Editor's history to save frequently-used queries
- Create additional views for custom reports
- Set up alerts in Neon for database usage
- Consider adding more indexes if queries are slow
