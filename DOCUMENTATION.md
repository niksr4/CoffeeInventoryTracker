# Coffee Inventory Tracker - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Authentication System](#authentication-system)
5. [Database Structure](#database-structure)
6. [Features & Modules](#features--modules)
7. [API Endpoints](#api-endpoints)
8. [Component Structure](#component-structure)
9. [Data Flow](#data-flow)
10. [Setup & Deployment](#setup--deployment)
11. [User Guide](#user-guide)
12. [Development Guidelines](#development-guidelines)

---

## Overview

### Purpose
The Coffee Inventory Tracker is a comprehensive web application designed for coffee estate management. It provides end-to-end tracking of coffee production from harvest to sales, including inventory management, processing, labor deployment, financial tracking, and business analytics.

### Key Capabilities
- **Inventory Management**: Track coffee beans by type (Arabica/Robusta), bag type (Dry P/Dry Cherry), and quantity
- **Processing Records**: Monitor coffee processing activities and quantities
- **Dispatch & Sales**: Manage coffee dispatch and sales with automatic inventory updates
- **Labor Management**: Track labor deployment and costs across estates
- **Financial Tracking**: Monitor expenses, revenues, and account summaries
- **Weather & Environmental**: Record rainfall data and weather information
- **AI-Powered Analytics**: Get AI-generated insights and market news
- **Multi-Estate Support**: Manage multiple estates (HF A, HF B, HF C, MV)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.8 (App Router)
- **React**: Version 19
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS 3.4.17
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

### Backend
- **Runtime**: Next.js API Routes (Server Actions & Route Handlers)
- **Database**: Neon Serverless PostgreSQL (4 separate databases)
- **Caching**: Upstash Redis (optional)
- **AI Integration**: Groq AI SDK

### Database Configuration
The application uses **4 separate Neon PostgreSQL databases**:
1. **Main Database**: Core inventory, transactions, consumables
2. **Accounts Database**: Financial transactions and summaries
3. **Processing Database**: Coffee processing records, pepper, rainfall
4. **Dispatch Database**: Dispatch records and sales

---

## Architecture

### File Structure
```
├── app/
│   ├── api/                    # API routes
│   │   ├── accounts-summary/   # Financial summaries
│   │   ├── dispatch/           # Dispatch management (POST, PUT, DELETE)
│   │   ├── sales/              # Sales management (GET, POST, PUT, DELETE)
│   │   ├── inventory/          # Inventory operations
│   │   ├── labor/              # Labor tracking
│   │   ├── processing-records/ # Processing data
│   │   ├── ai-analysis/        # AI insights
│   │   └── ...
│   ├── dashboard/              # Main dashboard page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Login page
│
├── components/
│   ├── accounts-page.tsx       # Financial accounts management
│   ├── dispatch-tab.tsx        # Coffee dispatch interface
│   ├── sales-tab.tsx           # Sales tracking interface
│   ├── inventory-system.tsx    # Core inventory management
│   ├── processing-tab.tsx      # Processing records
│   ├── labor-deployment-tab.tsx# Labor management
│   ├── pepper-tab.tsx          # Pepper tracking
│   ├── rainfall-tab.tsx        # Rainfall data
│   ├── weather-tab.tsx         # Weather information
│   └── ui/                     # shadcn/ui components
│
├── hooks/
│   ├── use-auth.tsx            # Authentication hook
│   ├── use-inventory-data.ts   # Inventory data fetching
│   ├── use-labor-data.ts       # Labor data fetching
│   └── ...
│
├── lib/
│   ├── neon-connections.ts     # Database connection management
│   ├── neon-storage.ts         # Database operations
│   ├── fiscal-year-utils.ts    # Fiscal year calculations
│   ├── date-utils.ts           # Date utilities
│   └── utils.ts                # General utilities
│
└── scripts/
    ├── 01-create-tables.sql    # Initial schema
    ├── 14-create-dispatch-table.sql
    ├── 16-update-sales-new-structure.sql
    └── ...                     # Migration scripts
```

### Design Patterns
- **Component Composition**: Modular components with single responsibility
- **Custom Hooks**: Reusable data fetching and state management
- **Server Components**: Default server-side rendering with client components where needed
- **API Route Handlers**: RESTful API design with proper HTTP methods
- **Fiscal Year Based**: All data filtered by fiscal year (April-March)

---

## Authentication System

### Implementation
**File**: `/components/login-page.tsx`, `/hooks/use-auth.tsx`

### Credentials
```typescript
// Two user accounts
1. Admin Account
   - Username: "admin"
   - Password: "admin127"
   - Role: "admin"
   
2. User Account
   - Username: "KAB123"
   - Password: "user127"
   - Role: "user"
```

### Authentication Flow
1. User enters credentials on login page (`/`)
2. `LoginPage` component validates against hardcoded credentials
3. On success, stores user info in `sessionStorage`
4. Redirects to `/dashboard`
5. `useAuth` hook provides authentication state throughout app

### Session Management
```typescript
// Storage
sessionStorage.setItem('user', JSON.stringify({ username, role }))

// Retrieval
const user = JSON.parse(sessionStorage.getItem('user') || 'null')

// Logout
sessionStorage.removeItem('user')
```

### Access Control

#### Admin Privileges (Full Access)
- View/Edit all tabs and features
- Access Accounts page with transaction history
- Edit/Delete all records
- View all analytics and reports

#### User Privileges (Limited Access)
- View basic inventory
- View transaction history (read-only)
- Can see edit/delete buttons on transactions
- **Cannot access**: Most admin-only tabs (checked via `isAdmin` boolean)

### Protected Routes
```typescript
// In components
const { user, isAdmin, logout } = useAuth()

// Check admin status
{isAdmin && (
  <AdminOnlyFeature />
)}

// Check specific user
{(isAdmin || user?.username === "KAB123") && (
  <TransactionHistory />
)}
```

---

## Database Structure

### Database 1: Main Database (Inventory)
**Connection**: `getNeonDb()` from `/lib/neon.ts`

#### Tables:
1. **inventory_transactions**
   - `id` SERIAL PRIMARY KEY
   - `transaction_date` DATE
   - `coffee_type` VARCHAR(50) - Arabica/Robusta
   - `bag_type` VARCHAR(50) - Dry P/Dry Cherry
   - `transaction_type` VARCHAR(20) - IN/OUT
   - `quantity_kgs` DECIMAL(10,2)
   - `created_by` VARCHAR(100)
   - `notes` TEXT
   - `created_at` TIMESTAMP
   - `updated_at` TIMESTAMP

2. **consumables**
   - `id` SERIAL PRIMARY KEY
   - `purchase_date` DATE
   - `item_name` VARCHAR(255)
   - `quantity` DECIMAL(10,2)
   - `unit` VARCHAR(50)
   - `price_per_unit` DECIMAL(10,2)
   - `total_cost` DECIMAL(12,2)
   - `supplier` VARCHAR(255)
   - `notes` TEXT

### Database 2: Accounts Database
**Connection**: `getAccountsDb()` from `/lib/neon-connections.ts`

#### Tables:
1. **account_transactions**
   - `id` SERIAL PRIMARY KEY
   - `transaction_date` DATE
   - `description` TEXT
   - `category` VARCHAR(100)
   - `amount` DECIMAL(12,2)
   - `type` VARCHAR(10) - DEBIT/CREDIT
   - `account` VARCHAR(100)
   - `created_at` TIMESTAMP

### Database 3: Processing Database
**Connection**: `getProcessingDb()` from `/lib/neon-connections.ts`

#### Tables:
1. **processing_records**
   - `id` SERIAL PRIMARY KEY
   - `processing_date` DATE
   - `arabica_p_type` DECIMAL(10,2)
   - `arabica_cherry_bags` DECIMAL(10,2)
   - `robusta_p_type_bags` DECIMAL(10,2)
   - `robusta_cherry_bags` DECIMAL(10,2)
   - `notes` TEXT

2. **labor_deployments**
   - `id` SERIAL PRIMARY KEY
   - `deployment_date` DATE
   - `estate` VARCHAR(100)
   - `head_count` INTEGER
   - `daily_wage` DECIMAL(10,2)
   - `total_cost` DECIMAL(12,2)
   - `activity` VARCHAR(255)
   - `notes` TEXT

3. **pepper_records**
   - Tracks pepper production alongside coffee

4. **rainfall_data**
   - `id` SERIAL PRIMARY KEY
   - `record_date` DATE
   - `location` VARCHAR(100)
   - `rainfall_mm` DECIMAL(10,2)
   - `notes` TEXT

### Database 4: Dispatch Database
**Connection**: `getDispatchDb()` from `/lib/neon-connections.ts`

#### Tables:
1. **dispatch_records**
   - `id` SERIAL PRIMARY KEY
   - `dispatch_date` DATE
   - `estate` VARCHAR(100)
   - `coffee_type` VARCHAR(50) - Arabica/Robusta
   - `bag_type` VARCHAR(50) - Dry P/Dry Cherry
   - `bags_dispatched` INTEGER
   - `notes` TEXT
   - `created_by` VARCHAR(100)
   - `created_at` TIMESTAMP
   - `updated_at` TIMESTAMP

2. **sales_records**
   - `id` SERIAL PRIMARY KEY
   - `sale_date` DATE
   - `coffee_type` VARCHAR(50) - Arabica/Robusta
   - `batch_no` VARCHAR(100) - B&L batch number (hfa, hfb, hfc, mv)
   - `estate` VARCHAR(100) - HF A, HF B, HF C, MV
   - `bags_sent` INTEGER - Number of bags sent
   - `kgs` DECIMAL(10,2) - Auto-calculated (bags_sent × 50)
   - `bags_sold` DECIMAL(10,2) - Actual bags sold (received)
   - `price_per_bag` DECIMAL(10,2) - Price per bag
   - `revenue` DECIMAL(12,2) - Auto-calculated (bags_sold × price_per_bag)
   - `bank_account` VARCHAR(255) - Bank account reference
   - `notes` TEXT
   - `created_at` TIMESTAMP
   - `updated_at` TIMESTAMP

### Indexes
```sql
-- Optimize date-based queries
CREATE INDEX idx_inventory_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_sales_date ON sales_records(sale_date);
CREATE INDEX idx_sales_coffee_type ON sales_records(coffee_type);
CREATE INDEX idx_dispatch_date ON dispatch_records(dispatch_date);
```

---

## Features & Modules

### 1. Inventory Management
**Component**: `/components/inventory-system.tsx`  
**API**: `/app/api/inventory/route.ts`, `/app/api/inventory-neon/route.ts`

#### Features:
- Add/Edit/Delete inventory transactions
- Track IN and OUT movements
- Real-time inventory balance calculation
- Fiscal year filtering
- Export to CSV
- Batch operations support

#### Data Flow:
1. User adds transaction via form
2. POST to `/api/inventory-neon`
3. Insert into `inventory_transactions` table
4. Real-time update of inventory totals
5. Display updated inventory by coffee type and bag type

#### Calculations:
```typescript
// Current inventory balance
const balance = ΣIN_transactions - ΣOUT_transactions

// By type
Arabica Dry P = (Arabica Dry P IN) - (Arabica Dry P OUT)
```

---

### 2. Dispatch Management
**Component**: `/components/dispatch-tab.tsx`  
**API**: `/app/api/dispatch/route.ts`

#### Features:
- Record coffee dispatch from estates
- Edit existing dispatch records
- Delete dispatch records
- Track dispatch by coffee type and estate
- Calculate available inventory for sales

#### Fields:
- **Date**: Dispatch date
- **Estate**: HF A, HF B, HF C, MV
- **Coffee Type**: Arabica/Robusta
- **Bag Type**: Dry P/Dry Cherry
- **Bags Dispatched**: Number of bags (integer)
- **Notes**: Optional notes

#### API Endpoints:
```typescript
POST   /api/dispatch      // Create dispatch record
PUT    /api/dispatch      // Update dispatch record
DELETE /api/dispatch      // Delete dispatch record
GET    /api/dispatch      // Get all dispatch records (fiscal year filtered)
```

---

### 3. Sales Management
**Component**: `/components/sales-tab.tsx`  
**API**: `/app/api/sales/route.ts`

#### Features:
- Record coffee sales with bags/kgs tracking
- Auto-calculate kgs sent (bags × 50)
- Auto-calculate revenue (bags sold × price per bag)
- Track available inventory (dispatched - sold)
- Edit/Delete sales records
- Display average price per bag
- Fiscal year filtering
- Export to CSV

#### Fields:
- **Date**: Sale date
- **Coffee Type**: Arabica/Robusta
- **B&L Batch No**: Batch number (hfa, hfb, hfc, mv)
- **Estate**: HF A, HF B, HF C, MV
- **Bags Sent**: Number of bags sent (input)
- **KGs**: Auto-calculated (bags_sent × 50) - READ ONLY
- **Bags Sold**: Actual bags received by buyer (input)
- **Price per Bag**: Price in Rs (input)
- **Revenue**: Auto-calculated (bags_sold × price_per_bag) - READ ONLY
- **Bank Account**: Bank account reference (optional)
- **Notes**: Additional notes (optional)

#### Inventory Tracking:
```typescript
// Available inventory calculation
Available Arabica = (Dispatched Arabica KGs) - (Sold Arabica KGs)
Available Robusta = (Dispatched Robusta KGs) - (Sold Robusta KGs)

// Conversions
KGs = Bags × 50
Bags = KGs / 50
```

#### Summary Cards:
1. **Total Revenue**: Sum of all revenue (with avg price per bag)
2. **Total Bags Sent**: Sum of bags sent
3. **Total Bags Sold**: Sum of bags sold
4. **Avg Price per Bag**: Total Revenue / Total Bags Sold

#### Inventory Available Card:
Shows for Arabica and Robusta:
- Available in KGs and Bags
- Dispatched totals
- Sold totals

---

### 4. Processing Records
**Component**: `/components/processing-tab.tsx`  
**API**: `/app/api/processing-records/route.ts`

#### Features:
- Track daily coffee processing quantities
- Record bags by coffee type (Arabica/Robusta) and processing type (P/Cherry)
- Fiscal year filtering
- Export to CSV

#### Fields:
- Processing Date
- Arabica P Type Bags
- Arabica Cherry Bags
- Robusta P Type Bags
- Robusta Cherry Bags
- Notes

---

### 5. Labor Deployment
**Component**: `/components/labor-deployment-tab.tsx`  
**API**: `/app/api/labor-neon/route.ts`

#### Features:
- Track labor deployment across estates
- Calculate daily labor costs
- Monitor headcount distribution
- Estate-wise labor analytics

#### Fields:
- Deployment Date
- Estate (HF A, HF B, HF C, MV)
- Head Count
- Daily Wage (Rs)
- Total Cost (auto-calculated: headcount × daily wage)
- Activity description
- Notes

---

### 6. Accounts Management
**Component**: `/components/accounts-page.tsx`  
**API**: `/app/api/accounts-summary/route.ts`, `/app/api/transactions-neon/route.ts`

#### Features:
- Financial transaction tracking (Debit/Credit)
- Account-wise summaries
- Category-based filtering
- Edit/Delete transactions
- Financial reports

#### Fields:
- Transaction Date
- Description
- Category
- Amount
- Type (DEBIT/CREDIT)
- Account name

---

### 7. Weather & Rainfall
**Components**: `/components/weather-tab.tsx`, `/components/rainfall-tab.tsx`  
**API**: `/app/api/weather/route.ts`, `/app/api/rainfall/route.ts`

#### Features:
- Weather data display (via OpenWeatherMap API)
- Rainfall tracking by location
- Historical rainfall data
- Environmental monitoring

---

### 8. Pepper Tracking
**Component**: `/components/pepper-tab.tsx`  
**API**: `/app/api/pepper-records/route.ts`

#### Features:
- Track pepper production alongside coffee
- Estate-wise pepper records
- Quantity tracking

---

### 9. AI-Powered Analytics
**Component**: `/components/ai-analysis-charts.tsx`  
**API**: `/app/api/ai-analysis/route.ts`, `/app/api/market-news/route.ts`

#### Features:
- AI-generated business insights using Groq
- Market news and trends
- Data visualization with charts
- Automated analysis of inventory and sales patterns

---

## API Endpoints

### Inventory APIs
```
GET    /api/inventory              # Get inventory transactions
POST   /api/inventory              # Create transaction
GET    /api/inventory-neon         # Get from Neon DB
POST   /api/inventory-neon         # Create in Neon DB
GET    /api/inventory-summary      # Get inventory summary
POST   /api/inventory/batch        # Batch insert
```

### Sales APIs
```
GET    /api/sales                  # Get sales records (fiscal year filtered)
POST   /api/sales                  # Create sales record
PUT    /api/sales                  # Update sales record
DELETE /api/sales?id={id}          # Delete sales record
```

### Dispatch APIs
```
GET    /api/dispatch               # Get dispatch records
POST   /api/dispatch               # Create dispatch record
PUT    /api/dispatch               # Update dispatch record
DELETE /api/dispatch?id={id}       # Delete dispatch record
```

### Labor APIs
```
GET    /api/labor-neon             # Get labor deployments
POST   /api/labor-neon             # Create labor deployment
DELETE /api/labor-neon?id={id}     # Delete labor deployment
```

### Processing APIs
```
GET    /api/processing-records     # Get processing records
POST   /api/processing-records     # Create processing record
```

### Accounts APIs
```
GET    /api/accounts-summary       # Get financial summary
GET    /api/transactions-neon      # Get transactions
POST   /api/transactions-neon      # Create transaction
PUT    /api/transactions-neon/update # Update transaction
DELETE /api/transactions-neon?id={id} # Delete transaction
POST   /api/transactions-neon/batch  # Batch insert
```

### Other APIs
```
GET    /api/weather                # Get weather data
GET    /api/rainfall               # Get rainfall records
POST   /api/rainfall               # Create rainfall record
GET    /api/pepper-records         # Get pepper records
POST   /api/pepper-records         # Create pepper record
GET    /api/ai-analysis            # Get AI insights
GET    /api/market-news            # Get market news
POST   /api/migrate-sales          # Run sales DB migration
```

---

## Component Structure

### Core Components

#### 1. InventorySystem (`/components/inventory-system.tsx`)
Main inventory management interface with tabs for different views.

**Props**: None  
**State**:
- `transactions`: Array of inventory transactions
- `isLoading`: Loading state
- `selectedFiscalYear`: Current fiscal year

**Key Functions**:
- `fetchTransactions()`: Load transactions from API
- `handleSave()`: Create new transaction
- `handleDelete()`: Delete transaction
- `calculateTotals()`: Calculate inventory balances

#### 2. SalesTab (`/components/sales-tab.tsx`)
Sales tracking with inventory availability monitoring.

**State**:
- `salesRecords`: Array of sales
- `dispatchTotals`: { arabica: number, robusta: number }
- `editingRecord`: Record being edited or null

**Key Functions**:
- `fetchDispatchedTotals()`: Get dispatch data
- `fetchSalesRecords()`: Load sales
- `calculateSoldTotals()`: Sum sold amounts by type
- `calculateAvailable()`: Dispatched - Sold
- `handleSave()`: Create/Update sale
- `handleEdit()`: Load record for editing
- `handleDelete()`: Delete sale

#### 3. DispatchTab (`/components/dispatch-tab.tsx`)
Dispatch management with edit/delete capabilities.

**State**:
- `dispatchRecords`: Array of dispatch records
- `editingRecord`: Record being edited

**Key Functions**:
- `fetchDispatchRecords()`: Load dispatches
- `handleSave()`: Create/Update dispatch
- `handleEdit()`: Load record for editing
- `resetForm()`: Clear form

### Utility Hooks

#### useAuth (`/hooks/use-auth.tsx`)
```typescript
const { user, isAdmin, login, logout } = useAuth()

// Returns:
{
  user: { username: string, role: string } | null
  isAdmin: boolean
  login: (username: string, role: string) => void
  logout: () => void
}
```

#### useInventoryData (`/hooks/use-inventory-data-neon.ts`)
```typescript
const { data, isLoading, error, refetch } = useInventoryData(fiscalYear)
```

---

## Data Flow

### 1. Sales Recording Flow
```
User Input (Sales Form)
  ↓
Fill fields: date, coffee_type, bags_sent, bags_sold, price_per_bag
  ↓
Auto-calculate: kgs = bags_sent × 50
Auto-calculate: revenue = bags_sold × price_per_bag
  ↓
POST /api/sales
  ↓
Insert into sales_records table (Dispatch DB)
  ↓
Refresh sales list
  ↓
Recalculate available inventory
  ↓
Update UI displays
```

### 2. Inventory Availability Calculation
```
Load Dispatch Records (fiscal year)
  ↓
Calculate Dispatched Totals by Coffee Type
  arabica_total_kgs = Σ(arabica_dispatches × 50)
  robusta_total_kgs = Σ(robusta_dispatches × 50)
  ↓
Load Sales Records (fiscal year)
  ↓
Calculate Sold Totals by Coffee Type
  arabica_sold_kgs = Σ(arabica_sales.bags_sold × 50)
  robusta_sold_kgs = Σ(robusta_sales.bags_sold × 50)
  ↓
Calculate Available
  arabica_available = arabica_total - arabica_sold
  robusta_available = robusta_total - robusta_sold
  ↓
Display in Inventory Available Card
```

### 3. Authentication Flow
```
User visits /
  ↓
Login Page renders
  ↓
User enters credentials
  ↓
Validate against hardcoded credentials
  ↓
On success:
  - Store user in sessionStorage
  - Redirect to /dashboard
  ↓
Dashboard checks auth via useAuth hook
  ↓
If not authenticated: redirect to /
If authenticated: show dashboard with role-based access
```

---

## Setup & Deployment

### Prerequisites
- Node.js 18+ and npm/yarn
- Neon PostgreSQL account with 4 databases
- (Optional) Upstash Redis account
- (Optional) Groq API key for AI features
- (Optional) OpenWeatherMap API key

### Environment Variables
Create `.env.local`:
```env
# Neon Database Connections
DATABASE_URL=postgresql://...           # Main DB
ACCOUNTS_DATABASE_URL=postgresql://...  # Accounts DB
PROCESSING_DATABASE_URL=postgresql://... # Processing DB
DISPATCH_DATABASE_URL=postgresql://...  # Dispatch DB

# Optional: AI Features
GROQ_API_KEY=your_groq_key

# Optional: Weather
OPENWEATHER_API_KEY=your_weather_key

# Optional: Caching
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd CoffeeInventoryTracker

# Install dependencies
npm install

# Run database migrations
# Connect to each Neon database and run scripts in order:
# 1. scripts/01-create-tables.sql (Main DB)
# 2. scripts/08-create-accounts-tables.sql (Accounts DB)
# 3. scripts/10-create-processing-table.sql (Processing DB)
# 4. scripts/14-create-dispatch-table.sql (Dispatch DB)
# 5. scripts/16-update-sales-new-structure.sql (Dispatch DB)

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Connect Neon databases via Vercel integrations
```

---

## User Guide

### Getting Started

#### 1. Login
- Navigate to application URL
- Use credentials:
  - Admin: `admin` / `admin127`
  - User: `KAB123` / `user127`
- Click "Sign In"

#### 2. Dashboard Navigation
The dashboard has multiple tabs:
- **Inventory**: Main inventory tracking
- **Dispatch**: Coffee dispatch management
- **Sales**: Sales recording and tracking
- **Processing**: Processing records
- **Labor**: Labor deployment
- **Pepper**: Pepper tracking
- **Rainfall**: Rainfall data
- **Weather**: Weather information
- **Accounts**: Financial management (Admin only)
- **AI Analysis**: Business insights (if configured)

### Common Tasks

#### Recording a Sale
1. Go to **Sales** tab
2. Select fiscal year (top right)
3. Fill in the form:
   - **Date**: Sale date
   - **Coffee Type**: Arabica or Robusta
   - **B&L Batch No**: Enter batch identifier
   - **Estate**: Select estate
   - **Bags Sent**: Enter number of bags
   - **Bags Sold**: Enter actual bags received
   - **Price per Bag**: Enter price in Rs
   - **Bank Account**: (Optional) Account reference
   - **Notes**: (Optional) Additional information
4. KGs and Revenue auto-calculate
5. Click "Save Sale"
6. Record appears in table below

#### Recording a Dispatch
1. Go to **Dispatch** tab
2. Click "+ Record Dispatch" or use form
3. Fill in:
   - **Date**: Dispatch date
   - **Estate**: Select estate
   - **Coffee Type**: Arabica/Robusta
   - **Bag Type**: Dry P/Dry Cherry
   - **Bags Dispatched**: Number of bags
   - **Notes**: (Optional)
4. Click "Save Dispatch"

#### Editing a Record
1. Find record in table
2. Click pencil icon (Edit button)
3. Form populates with existing data
4. Modify fields
5. Click "Update" button
6. Click "Cancel" to abort editing

#### Deleting a Record
1. Find record in table
2. Click trash icon (Delete button)
3. Confirm deletion
4. Record is removed

#### Viewing Available Inventory
1. Go to **Sales** tab
2. View "Inventory Available for Sale" card at top
3. Shows:
   - **Arabica Available**: In KGs and bags
   - **Robusta Available**: In KGs and bags
   - Dispatched vs Sold breakdown

#### Exporting Data
1. Go to desired tab (Sales, Dispatch, etc.)
2. Click "Export CSV" button
3. CSV file downloads with all records

#### Changing Fiscal Year
1. Look for "Fiscal Year" dropdown (top right)
2. Select desired fiscal year (e.g., FY 2024-25)
3. Data automatically filters to that year

---

## Development Guidelines

### Code Organization
- **Components**: One component per file, named after component
- **Hooks**: Prefix with `use`, e.g., `useAuth`
- **Utils**: Pure functions in `/lib`
- **Types**: Define interfaces at component level or in separate types file
- **API Routes**: One route handler per endpoint

### Naming Conventions
```typescript
// Components: PascalCase
SalesTab.tsx, InventorySystem.tsx

// Files: kebab-case
sales-tab.tsx, use-inventory-data.ts

// Functions: camelCase
fetchSalesRecords(), calculateTotals()

// Constants: SCREAMING_SNAKE_CASE
const COFFEE_TYPES = ["Arabica", "Robusta"]

// Database tables: snake_case
sales_records, dispatch_records
```

### State Management
```typescript
// Local state for component-specific data
const [isLoading, setIsLoading] = useState(false)

// Custom hooks for shared data
const { data, refetch } = useInventoryData(fiscalYear)

// Session storage for auth
sessionStorage.setItem('user', JSON.stringify(user))
```

### API Route Pattern
```typescript
export async function GET(request: Request) {
  try {
    const sql = getDatabaseConnection()
    const { searchParams } = new URL(request.url)
    const param = searchParams.get('param')
    
    const result = await sql`SELECT * FROM table WHERE condition`
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### Database Best Practices
1. **Always use parameterized queries** (template literals with `sql`)
2. **Handle errors gracefully** with try/catch
3. **Return consistent response format**: `{ success: boolean, data?: any, error?: string }`
4. **Use transactions** for multi-step operations
5. **Add indexes** for frequently queried columns (dates, IDs)
6. **Validate input** before database operations

### TypeScript Guidelines
```typescript
// Define interfaces for data structures
interface SalesRecord {
  id?: number
  sale_date: string
  coffee_type: string
  // ... other fields
}

// Use type annotations
function calculateTotals(records: SalesRecord[]): number {
  return records.reduce((sum, r) => sum + r.revenue, 0)
}

// Avoid 'any', prefer 'unknown' if type is truly unknown
```

### Fiscal Year Logic
```typescript
// Fiscal year: April 1 to March 31
function getFiscalYearDateRange(fiscalYear: FiscalYear) {
  return {
    startDate: `${fiscalYear.startYear}-04-01`,
    endDate: `${fiscalYear.endYear}-03-31`
  }
}

// Always filter by fiscal year in queries
WHERE transaction_date >= ${startDate} 
  AND transaction_date <= ${endDate}
```

### Auto-Calculation Fields
```typescript
// In forms, auto-calculate and display as read-only
const kgs = bagsSent ? Number(bagsSent) * 50 : 0
const revenue = bagsSold && pricePerBag 
  ? Number(bagsSold) * Number(pricePerBag) 
  : 0

// Display
<div className="flex items-center h-10 px-3 border rounded-md bg-muted">
  <span className="font-medium">{kgs.toFixed(2)} KGs</span>
</div>
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: database "neondb" does not exist
```
**Solution**: 
- Check environment variables are set correctly
- Verify DATABASE_URL matches your Neon database
- Run migrations in correct database

#### 2. Authentication Not Persisting
**Solution**:
- Check sessionStorage is enabled in browser
- Verify `useAuth` hook is imported correctly
- Check for typos in credentials

#### 3. Data Not Showing
**Solution**:
- Check fiscal year filter - data may be in different year
- Verify database has data: Run SQL query directly
- Check API response in browser DevTools Network tab
- Look for errors in browser console

#### 4. Calculation Errors
**Solution**:
- Verify input types (number vs string)
- Check for null/undefined values
- Ensure Number() conversions are correct

---

## Future Enhancements

### Planned Features
1. **Multi-tenant Support**: Support for multiple coffee estates
2. **Advanced Analytics**: More detailed reports and visualizations
3. **Mobile App**: React Native mobile version
4. **Automated Alerts**: Low inventory, high costs notifications
5. **Integration**: Connect with accounting software
6. **Barcode Scanning**: For inventory tracking
7. **Role-Based Permissions**: More granular access control
8. **Data Import**: Bulk import from Excel/CSV
9. **API Documentation**: Auto-generated API docs
10. **Unit Tests**: Comprehensive test coverage

### Database Consolidation
Consider merging 4 databases into 1 for:
- Simpler queries with JOINs
- Better data integrity with foreign keys
- Reduced connection overhead
- Easier maintenance

---

## Support & Contact

### Documentation Updates
This documentation should be updated when:
- New features are added
- Database schema changes
- API endpoints change
- Authentication logic updates
- Major refactoring occurs

### Version History
- **v1.0** (Current): Initial comprehensive documentation
  - Full feature set documented
  - All API endpoints listed
  - Database structure defined
  - User guide included

---

## Appendix

### A. SQL Schema Reference

See individual migration scripts in `/scripts/` folder:
- `01-create-tables.sql`: Initial inventory schema
- `08-create-accounts-tables.sql`: Accounts schema
- `10-create-processing-table.sql`: Processing schema
- `14-create-dispatch-table.sql`: Dispatch schema
- `16-update-sales-new-structure.sql`: Sales schema

### B. Component Props Reference

Most components are self-contained with no props. They manage their own state and API calls.

### C. Keyboard Shortcuts
None currently implemented. Future enhancement opportunity.

### D. Browser Compatibility
- Chrome 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support
- Edge 90+: Full support

### E. Performance Considerations
- **Database queries**: Filtered by fiscal year to limit data
- **Pagination**: Consider implementing for large datasets
- **Caching**: Redis caching available but not fully utilized
- **Code splitting**: Next.js handles automatically

---

**Last Updated**: January 29, 2026  
**Version**: 1.0  
**Maintained by**: Development Team
