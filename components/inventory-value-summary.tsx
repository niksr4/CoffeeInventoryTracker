"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Package, AlertTriangle, DollarSign, Users } from "lucide-react"

type InventoryItem = {
  name: string
  quantity: number
  unit: string
  price?: number
}

type Transaction = {
  id: string
  itemType: string
  quantity: number
  transactionType: "Depleting" | "Restocking" | "Item Deleted" | "Unit Change" | "Price Update"
  notes: string
  date: string
  user: string
  unit: string
  price?: number
  totalCost?: number
}

interface InventoryValueSummaryProps {
  items: InventoryItem[]
  transactions: Transaction[]
  totalLaborExpenses: number
}

export function InventoryValueSummary({ items, transactions, totalLaborExpenses }: InventoryValueSummaryProps) {
  // Calculate total inventory value
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.price || 0) * item.quantity
  }, 0)

  // Count low stock items (quantity < 10)
  const lowStockItems = items.filter((item) => item.quantity > 0 && item.quantity < 10).length

  // Count out of stock items
  const outOfStockItems = items.filter((item) => item.quantity === 0).length

  // Count recent transactions (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentTransactions = transactions.filter((transaction) => {
    try {
      // Parse the date string (format: "DD/MM/YYYY HH:MM")
      const [datePart] = transaction.date.split(" ")
      const [day, month, year] = datePart.split("/")
      const transactionDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      return transactionDate >= sevenDaysAgo
    } catch {
      return false
    }
  }).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Across {items.length} items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Labor Expenses</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalLaborExpenses.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">All time expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItems}</div>
          <p className="text-xs text-muted-foreground">Items with {"<"} 10 units</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{outOfStockItems}</div>
          <p className="text-xs text-muted-foreground">Items with 0 quantity</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentTransactions}</div>
          <p className="text-xs text-muted-foreground">Transactions (7 days)</p>
        </CardContent>
      </Card>
    </div>
  )
}
