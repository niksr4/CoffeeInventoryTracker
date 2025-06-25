"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Package, Calculator } from "lucide-react"
import type { Transaction, InventoryItem } from "@/lib/storage"
import { useInventoryValuation } from "@/hooks/use-inventory-valuation" // Import the new hook

interface InventoryValueSummaryProps {
  inventory: InventoryItem[] // Still useful for 'total items' count
  transactions: Transaction[]
}

export default function InventoryValueSummary({ inventory, transactions }: InventoryValueSummaryProps) {
  const itemValues = useInventoryValuation(transactions) // Use the new hook

  // Calculate totals based on the output of useInventoryValuation
  const totalInventoryValue = Object.values(itemValues).reduce((sum, item) => sum + item.totalValue, 0)

  // Total Investment (all-time restocking costs)
  // This needs to be calculated directly from transactions as before,
  // as the hook focuses on current value, not historical spend.
  const totalRestockingCost = transactions
    .filter((t) => t.transactionType === "Restocking" && t.totalCost)
    .reduce((sum, t) => sum + (t.totalCost || 0), 0)

  const itemsWithValue = Object.keys(itemValues).filter((key) => itemValues[key]?.totalValue > 0).length

  // Recent restocking activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentRestockingCost = transactions
    .filter((t) => {
      if (t.transactionType !== "Restocking" || !t.totalCost) return false
      try {
        const transactionDate = new Date(t.date)
        return transactionDate >= thirtyDaysAgo
      } catch {
        return false // Handle invalid date strings gracefully
      }
    })
    .reduce((sum, t) => sum + (t.totalCost || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalInventoryValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Based on FIFO & base prices</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalRestockingCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">All-time restocking costs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items with Value</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{itemsWithValue}</div>
          <p className="text-xs text-muted-foreground">Out of {inventory.length} total defined items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Investment</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{recentRestockingCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Last 30 days restocking</p>
        </CardContent>
      </Card>
    </div>
  )
}
