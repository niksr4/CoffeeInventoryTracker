"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, List, TrendingUp, TrendingDown } from "lucide-react"
import type { InventoryItem, Transaction } from "@/lib/storage"
import { useInventoryValuation } from "@/hooks/use-inventory-valuation"

interface InventoryValueSummaryProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
}

export default function InventoryValueSummary({ inventory, transactions }: InventoryValueSummaryProps) {
  const itemValues = useInventoryValuation(transactions)

  // Filter for items with quantity > 0
  const activeInventory = inventory.filter((item) => item.quantity > 0)

  const totalValue = activeInventory.reduce((sum, item) => {
    const valueInfo = itemValues[item.name]
    return sum + (valueInfo ? valueInfo.totalValue : 0)
  }, 0)

  // Use the length of the filtered array
  const totalItemsInStock = activeInventory.length

  const recentTransactions = transactions.slice(0, 20) // Look at last 20 transactions for trends
  const restockingValue = recentTransactions
    .filter((t) => t.transactionType === "Restocking" && t.totalCost)
    .reduce((sum, t) => sum + (t.totalCost || 0), 0)

  const depletionCount = recentTransactions.filter((t) => t.transactionType === "Depleting").length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Across {totalItemsInStock} items in stock</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
          <List className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItemsInStock}</div>
          <p className="text-xs text-muted-foreground">Unique items with quantity greater than zero</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Restocking Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+₹{restockingValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Based on last 20 transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Depletions</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{depletionCount}</div>
          <p className="text-xs text-muted-foreground">Based on last 20 transactions</p>
        </CardContent>
      </Card>
    </div>
  )
}
