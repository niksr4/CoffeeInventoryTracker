"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, TrendingUp, Scale } from "lucide-react"

interface InventoryValueSummaryProps {
  inventory: Array<{
    name: string
    quantity: number
    unit: string
    avg_price?: number
    total_cost?: number
  }>
  transactions: Array<any>
  summary?: {
    total_inventory_value: number
    total_items: number
    total_quantity: number
  }
}

export default function InventoryValueSummary({ inventory, transactions, summary }: InventoryValueSummaryProps) {
  // Use summary from props if available (from Neon), otherwise calculate
  const totalValue = summary?.total_inventory_value || 0
  const totalItems = summary?.total_items || inventory.length
  const totalQuantity = summary?.total_quantity || inventory.reduce((sum, item) => sum + item.quantity, 0)

  // Calculate recent activity from transactions (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentTransactions = transactions.filter((t) => {
    try {
      const txDate = new Date(t.date)
      return txDate >= sevenDaysAgo
    } catch {
      return false
    }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground">Based on weighted average cost</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground">Unique inventory items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalQuantity.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Combined units across all items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentTransactions.length}</div>
          <p className="text-xs text-muted-foreground">Transactions in last 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
