"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { InventoryItem, Transaction } from "@/lib/inventory-service"

interface AiAnalysisChartsProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
}

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"] // Green palette

// Helper to parse DD/MM/YYYY HH:MM date strings
const parseTransactionDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null
  const parts = dateString.split(" ")
  if (parts.length < 1) return null
  const dateParts = parts[0].split("/")
  if (dateParts.length !== 3) return null
  // DD/MM/YYYY -> YYYY-MM-DD
  const isoDateString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
  const date = new Date(isoDateString)
  return isNaN(date.getTime()) ? null : date
}

export default function AiAnalysisCharts({ inventory, transactions }: AiAnalysisChartsProps) {
  React.useEffect(() => {
    console.log("AiAnalysisCharts received transactions:", transactions)
    console.log("AiAnalysisCharts received inventory:", inventory)
  }, [transactions, inventory])

  const consumptionData = React.useMemo(() => {
    const monthlyConsumption: { [key: string]: { date: Date; total: number } } = {}
    transactions
      .filter((t) => t.transactionType === "Depleting")
      .forEach((t) => {
        const date = parseTransactionDate(t.date)
        if (date) {
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` // YYYY-MM format for sorting
          if (!monthlyConsumption[monthYear]) {
            monthlyConsumption[monthYear] = { date: new Date(date.getFullYear(), date.getMonth(), 1), total: 0 }
          }
          monthlyConsumption[monthYear].total += Number(t.quantity) || 0
        }
      })

    const sortedData = Object.values(monthlyConsumption)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6) // Limit to last 6 months
      .map((item) => ({
        month: item.date.toLocaleString("default", { month: "short", year: "2-digit" }), // For display
        total: item.total,
      }))
    console.log("Processed consumptionData:", sortedData)
    return sortedData
  }, [transactions])

  const costAnalysisData = React.useMemo(() => {
    const itemCosts: { [key: string]: number } = {}
    transactions
      .filter((t) => t.transactionType === "Restocking" && t.totalCost !== undefined && t.totalCost !== null)
      .forEach((t) => {
        if (!itemCosts[t.itemType]) {
          itemCosts[t.itemType] = 0
        }
        itemCosts[t.itemType] += Number(t.totalCost) || 0
      })

    const sortedData = Object.entries(itemCosts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) // Top 6 items by cost
    console.log("Processed costAnalysisData:", sortedData)
    return sortedData
  }, [transactions])

  const inventoryValueData = React.useMemo(() => {
    if (transactions.length === 0) {
      console.log("Processed inventoryValueData (no transactions): []")
      return []
    }

    const chronologicalTransactions = [...transactions]
      .map((t) => ({ ...t, parsedDate: parseTransactionDate(t.date) }))
      .filter((t) => t.parsedDate !== null)
      .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime())

    const itemValues: Record<string, { quantity: number; totalValue: number; avgPrice: number }> = {}
    let runningTotalValue = 0
    const valueOverTime: { date: string; value: number }[] = []

    chronologicalTransactions.forEach((transaction) => {
      const { itemType, quantity, transactionType, price, totalCost, parsedDate } = transaction
      if (!itemValues[itemType]) itemValues[itemType] = { quantity: 0, totalValue: 0, avgPrice: 0 }

      const currentItem = itemValues[itemType]
      const numQuantity = Number(quantity) || 0

      if (transactionType === "Restocking") {
        const cost = Number(totalCost) || numQuantity * (Number(price) || 0)
        currentItem.quantity += numQuantity
        currentItem.totalValue += cost
        currentItem.avgPrice = currentItem.quantity > 0 ? currentItem.totalValue / currentItem.quantity : 0
        runningTotalValue += cost
      } else if (transactionType === "Depleting") {
        const depletedValue = numQuantity * (currentItem.avgPrice || 0)
        currentItem.quantity = Math.max(0, currentItem.quantity - numQuantity)
        currentItem.totalValue = Math.max(0, currentItem.totalValue - depletedValue)
        runningTotalValue -= depletedValue
        if (currentItem.quantity > 0) {
          currentItem.avgPrice = currentItem.totalValue / currentItem.quantity
        } else {
          currentItem.avgPrice = 0
          // currentItem.totalValue is already adjusted
        }
      }
      // For "Item Deleted" or "Unit Change", current logic might need adjustment if they affect value.
      // Assuming they are handled by inventory rebuild or specific value adjustments not covered here.

      if (parsedDate) {
        const formattedDate = parsedDate.toISOString().split("T")[0] // YYYY-MM-DD
        valueOverTime.push({ date: formattedDate, value: Math.max(0, runningTotalValue) })
      }
    })

    const dailyValues = valueOverTime.reduce(
      (acc, curr) => {
        acc[curr.date] = curr.value
        return acc
      },
      {} as Record<string, number>,
    )

    const sortedData = Object.entries(dailyValues)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ensure chronological order
      .slice(-30) // Last 30 days
    console.log("Processed inventoryValueData:", sortedData)
    return sortedData
  }, [transactions])

  const consumptionChartConfig: ChartConfig = {
    total: {
      label: "Units Consumed",
      color: COLORS[0],
    },
  }

  const costChartConfig: ChartConfig = {
    value: {
      label: "Cost (₹)",
    },
    ...costAnalysisData.reduce((acc, item, index) => {
      acc[item.name] = { label: item.name, color: COLORS[index % COLORS.length] }
      return acc
    }, {} as ChartConfig),
  }

  const valueChartConfig: ChartConfig = {
    value: {
      label: "Total Value (₹)",
      color: COLORS[1],
    },
  }

  if (transactions.length === 0 && inventory.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                {i === 1 ? "Monthly Consumption" : i === 2 ? "Restocking Cost Analysis" : "Inventory Value Over Time"}
              </CardTitle>
              <CardDescription>No data available to display charts.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">Please add some transactions.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Monthly Consumption</CardTitle>
          <CardDescription>Total units depleted in the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          {consumptionData.length > 0 ? (
            <ChartContainer config={consumptionChartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={consumptionData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No consumption data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Restocking Cost Analysis</CardTitle>
          <CardDescription>Top 6 items by restocking cost.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {costAnalysisData.length > 0 ? (
            <ChartContainer config={costChartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={costAnalysisData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                      const x = cx + radius * Math.cos(-midAngle * RADIAN)
                      const y = cy + radius * Math.sin(-midAngle * RADIAN)
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize="10px"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                  >
                    {costAnalysisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    content={({ payload }) => (
                      <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-xs">
                        {payload?.map((entry, index) => (
                          <li key={`item-${index}`} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No cost data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>Inventory Value Over Time</CardTitle>
          <CardDescription>Total inventory value over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryValueData.length > 0 ? (
            <ChartContainer config={valueChartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={inventoryValueData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={
                      (value) =>
                        new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) // Ensure date is treated as local
                    }
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No inventory value data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
