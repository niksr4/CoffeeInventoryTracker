"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, DollarSign, Activity } from "lucide-react"
import type { InventoryItem } from "@/lib/inventory-service"

interface Transaction {
  id: string
  itemType: string
  quantity: number
  transactionType: "Depleting" | "Restocking" | "Item Deleted" | "Unit Change"
  notes: string
  date: string
  user: string
  unit: string
  price?: number
  totalCost?: number
}

interface InventorySummary {
  total_inventory_value: number
  total_items: number
  total_quantity: number
}

interface InventoryValueSummaryProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
  summary: InventorySummary
}

// Helper function to parse the custom date format (DD/MM/YYYY HH:MM)
const parseCustomDateString = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null

  try {
    // Split into date and time parts
    const parts = dateString.trim().split(" ")
    if (parts.length < 2) return null

    const dateParts = parts[0].split("/")
    const timeParts = parts[1].split(":")

    if (dateParts.length !== 3 || timeParts.length !== 2) return null

    const day = Number.parseInt(dateParts[0], 10)
    const month = Number.parseInt(dateParts[1], 10) - 1 // JavaScript months are 0-indexed
    const year = Number.parseInt(dateParts[2], 10)
    const hour = Number.parseInt(timeParts[0], 10)
    const minute = Number.parseInt(timeParts[1], 10)

    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
      return null
    }

    const date = new Date(year, month, day, hour, minute)

    // Validate the date
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date
    }

    return null
  } catch (error) {
    console.error("Error parsing date:", dateString, error)
    return null
  }
}

// Helper function to check if a date is within the last N days
const isWithinLastNDays = (dateString: string, days: number): boolean => {
  const date = parseCustomDateString(dateString)
  if (!date) return false

  const now = new Date()
  const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return date >= daysAgo && date <= now
}

export default function InventoryValueSummary({ inventory, transactions, summary }: InventoryValueSummaryProps) {
  // Calculate recent activity (transactions in last 7 days)
  const recentTransactionsCount = transactions.filter((t) => isWithinLastNDays(t.date, 7)).length

  console.log("📊 InventoryValueSummary:", {
    totalTransactions: transactions.length,
    recentTransactionsCount,
    sampleDates: transactions.slice(0, 5).map((t) => ({
      date: t.date,
      parsed: parseCustomDateString(t.date),
      isRecent: isWithinLastNDays(t.date, 7),
    })),
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{summary.total_inventory_value.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Based on weighted average cost</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_items}</div>
          <p className="text-xs text-muted-foreground">Unique inventory items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total_quantity.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Combined units across all items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentTransactionsCount}</div>
          <p className="text-xs text-muted-foreground">Transactions in last 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
