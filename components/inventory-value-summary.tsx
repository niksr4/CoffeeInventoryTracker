import { TrendingUp, Package, Scale, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryItem, Transaction } from "@/lib/inventory-service"

interface InventoryValueSummaryProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
  summary: {
    total_inventory_value: number
    total_items: number
    total_quantity: number
  }
}

const parseCustomDateString = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null

  // Handle format: DD/MM/YYYY HH:MM
  const parts = dateString.split(" ")
  const dateParts = parts[0].split("/")
  const timeParts = parts[1] ? parts[1].split(":") : ["00", "00"]

  if (dateParts.length !== 3) return null

  const day = Number.parseInt(dateParts[0], 10)
  const month = Number.parseInt(dateParts[1], 10) - 1 // JS months are 0-indexed
  const year = Number.parseInt(dateParts[2], 10)
  const hour = Number.parseInt(timeParts[0], 10)
  const minute = Number.parseInt(timeParts[1], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return null
  }

  const date = new Date(year, month, day, hour, minute)

  // Validate the date is correct
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return date
  }

  return null
}

const isWithinLastNDays = (dateString: string, days: number): boolean => {
  try {
    const date = parseCustomDateString(dateString)
    if (!date) return false

    const now = new Date()
    const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return date >= daysAgo && date <= now
  } catch (error) {
    console.error("Error checking date:", error)
    return false
  }
}

export default function InventoryValueSummary({ inventory, transactions, summary }: InventoryValueSummaryProps) {
  // Calculate recent activity (last 7 days)
  const recentTransactions = transactions.filter((t) => isWithinLastNDays(t.date, 7))

  console.log("📊 Recent activity calculation:")
  console.log("  Total transactions:", transactions.length)
  console.log("  Transactions in last 7 days:", recentTransactions.length)
  console.log(
    "  Sample dates:",
    transactions.slice(0, 3).map((t) => t.date),
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
          <Scale className="h-4 w-4 text-muted-foreground" />
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
          <div className="text-2xl font-bold">{recentTransactions.length}</div>
          <p className="text-xs text-muted-foreground">Transactions in last 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
