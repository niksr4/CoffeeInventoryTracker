"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Package, Calculator } from "lucide-react"
import type { Transaction, InventoryItem } from "@/lib/storage"

interface InventoryValueSummaryProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
}

export default function InventoryValueSummary({ inventory, transactions }: InventoryValueSummaryProps) {
  // Calculate inventory value using FIFO (First In, First Out) method
  const calculateInventoryValue = () => {
    const itemValues: Record<string, { quantity: number; totalValue: number; avgPrice: number }> = {}

    // Process transactions chronologically (oldest first)
    const chronologicalTransactions = [...transactions].reverse()

    for (const transaction of chronologicalTransactions) {
      const { itemType, quantity, transactionType, price, totalCost } = transaction

      if (!itemValues[itemType]) {
        itemValues[itemType] = { quantity: 0, totalValue: 0, avgPrice: 0 }
      }

      if (transactionType === "Restocking" && price && totalCost) {
        // Add to inventory with cost
        itemValues[itemType].quantity += quantity
        itemValues[itemType].totalValue += totalCost
        itemValues[itemType].avgPrice = itemValues[itemType].totalValue / itemValues[itemType].quantity
      } else if (transactionType === "Depleting") {
        // Remove from inventory (FIFO - use average price)
        const depletedValue = quantity * (itemValues[itemType].avgPrice || 0)
        itemValues[itemType].quantity = Math.max(0, itemValues[itemType].quantity - quantity)
        itemValues[itemType].totalValue = Math.max(0, itemValues[itemType].totalValue - depletedValue)

        // Recalculate average price if quantity > 0
        if (itemValues[itemType].quantity > 0) {
          itemValues[itemType].avgPrice = itemValues[itemType].totalValue / itemValues[itemType].quantity
        } else {
          itemValues[itemType].avgPrice = 0
          itemValues[itemType].totalValue = 0
        }
      }
    }

    return itemValues
  }

  const itemValues = calculateInventoryValue()

  // Calculate totals
  const totalInventoryValue = Object.values(itemValues).reduce((sum, item) => sum + item.totalValue, 0)
  const totalRestockingCost = transactions
    .filter((t) => t.transactionType === "Restocking" && t.totalCost)
    .reduce((sum, t) => sum + (t.totalCost || 0), 0)

  const itemsWithValue = Object.keys(itemValues).filter((key) => itemValues[key].totalValue > 0).length

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
        return false
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
          <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Based on FIFO costing method</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRestockingCost.toFixed(2)}</div>
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
          <p className="text-xs text-muted-foreground">Out of {inventory.length} total items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Investment</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${recentRestockingCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
