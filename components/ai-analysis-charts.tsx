"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Area, AreaChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { InventoryItem, Transaction } from "@/lib/inventory-service"
import { useLaborData } from "@/hooks/use-labor-data"
import { useConsumablesData } from "@/hooks/use-consumables-data"

interface AiAnalysisChartsProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
}

const COLORS = [
  "#059669", // Emerald-600
  "#dc2626", // Red-600
  "#2563eb", // Blue-600
  "#ea580c", // Orange-600
  "#7c3aed", // Violet-600
  "#0891b2", // Cyan-600
  "#be185d", // Pink-600
  "#65a30d", // Lime-600
  "#4338ca", // Indigo-600
  "#0d9488", // Teal-600
  "#f59e0b", // Amber-500
  "#ef4444", // Red-500
]

// Helper to parse DD/MM/YYYY HH:MM date strings
const parseTransactionDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null

  // Handle YYYY-MM-DD format (from labor/consumables)
  if (dateString.includes("-") && dateString.length === 10) {
    const date = new Date(dateString + "T00:00:00")
    return isNaN(date.getTime()) ? null : date
  }

  // Handle DD/MM/YYYY HH:MM format (from transactions)
  const parts = dateString.split(" ")
  if (parts.length < 1) return null
  const dateParts = parts[0].split("/")
  if (dateParts.length !== 3) return null
  // DD/MM/YYYY -> YYYY-MM-DD
  const isoDateString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
  const date = new Date(isoDateString + "T00:00:00")
  return isNaN(date.getTime()) ? null : date
}

export default function AiAnalysisCharts({ inventory, transactions }: AiAnalysisChartsProps) {
  const { deployments: laborDeployments } = useLaborData()
  const { deployments: consumableDeployments } = useConsumablesData()

  console.log("[v0] AI Charts - Data received:", {
    inventoryCount: inventory.length,
    transactionsCount: transactions.length,
    laborDeploymentsCount: laborDeployments.length,
    consumableDeploymentsCount: consumableDeployments.length,
    sampleInventory: inventory.slice(0, 2),
    sampleTransactions: transactions.slice(0, 2),
    sampleLabor: laborDeployments.slice(0, 2),
    sampleConsumables: consumableDeployments.slice(0, 2),
  })

  const topInventoryByValue = React.useMemo(() => {
    const itemValues: { [key: string]: { quantity: number; totalValue: number; avgPrice: number } } = {}

    // Calculate average price and current value for each item
    transactions
      .filter((t) => t.transactionType === "Restocking" && t.totalCost)
      .forEach((t) => {
        if (!itemValues[t.itemType]) itemValues[t.itemType] = { quantity: 0, totalValue: 0, avgPrice: 0 }
        const cost = Number(t.totalCost) || 0
        const qty = Number(t.quantity) || 0
        itemValues[t.itemType].totalValue += cost
        itemValues[t.itemType].quantity += qty
        itemValues[t.itemType].avgPrice = itemValues[t.itemType].totalValue / itemValues[t.itemType].quantity
      })

    // Apply depletion transactions
    transactions
      .filter((t) => t.transactionType === "Depleting")
      .forEach((t) => {
        if (itemValues[t.itemType]) {
          const qty = Number(t.quantity) || 0
          itemValues[t.itemType].quantity = Math.max(0, itemValues[t.itemType].quantity - qty)
        }
      })

    // Get current inventory with values
    const inventoryWithValues = inventory
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        avgPrice: itemValues[item.name]?.avgPrice || 0,
        currentValue: item.quantity * (itemValues[item.name]?.avgPrice || 0),
      }))
      .filter((item) => item.currentValue > 0)
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 8)

    console.log("[v0] Top Inventory calculation:", {
      itemValuesCount: Object.keys(itemValues).length,
      inventoryWithValuesCount: inventoryWithValues.length,
      sampleItemValues: Object.entries(itemValues).slice(0, 3),
      finalResult: inventoryWithValues,
    })

    return inventoryWithValues
  }, [inventory, transactions])

  const laborEfficiencyData = React.useMemo(() => {
    const codeAnalysis: { [key: string]: { totalCost: number; deployments: number; avgCost: number } } = {}

    laborDeployments.forEach((deployment) => {
      if (!codeAnalysis[deployment.code]) {
        codeAnalysis[deployment.code] = { totalCost: 0, deployments: 0, avgCost: 0 }
      }
      codeAnalysis[deployment.code].totalCost += deployment.totalCost
      codeAnalysis[deployment.code].deployments += 1
      codeAnalysis[deployment.code].avgCost =
        codeAnalysis[deployment.code].totalCost / codeAnalysis[deployment.code].deployments
    })

    const result = Object.entries(codeAnalysis)
      .map(([code, data]) => ({
        code,
        totalCost: data.totalCost,
        deployments: data.deployments,
        avgCost: data.avgCost,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 6)

    console.log("[v0] Labor Efficiency calculation:", {
      codeAnalysisCount: Object.keys(codeAnalysis).length,
      resultCount: result.length,
      sampleResult: result.slice(0, 2),
    })

    return result
  }, [laborDeployments])

  const inventoryTurnoverData = React.useMemo(() => {
    const itemActivity: { [key: string]: { restocked: number; depleted: number; turnoverRate: number } } = {}

    transactions.forEach((t) => {
      if (!itemActivity[t.itemType]) {
        itemActivity[t.itemType] = { restocked: 0, depleted: 0, turnoverRate: 0 }
      }

      if (t.transactionType === "Restocking") {
        itemActivity[t.itemType].restocked += Number(t.quantity) || 0
      } else if (t.transactionType === "Depleting") {
        itemActivity[t.itemType].depleted += Number(t.quantity) || 0
      }
    })

    // Calculate turnover rate (depleted / restocked)
    Object.keys(itemActivity).forEach((item) => {
      const data = itemActivity[item]
      data.turnoverRate = data.restocked > 0 ? (data.depleted / data.restocked) * 100 : 0
    })

    return Object.entries(itemActivity)
      .map(([name, data]) => ({
        name,
        restocked: data.restocked,
        depleted: data.depleted,
        turnoverRate: Math.round(data.turnoverRate),
      }))
      .filter((item) => item.restocked > 0 || item.depleted > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 8)
  }, [transactions])

  const cashFlowData = React.useMemo(() => {
    const monthlyFlow: { [key: string]: { date: Date; inflow: number; outflow: number; netFlow: number } } = {}

    // Inventory restocking (outflow)
    transactions
      .filter((t) => t.transactionType === "Restocking" && t.totalCost)
      .forEach((t) => {
        const date = parseTransactionDate(t.date)
        if (date) {
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          if (!monthlyFlow[monthYear]) {
            monthlyFlow[monthYear] = {
              date: new Date(date.getFullYear(), date.getMonth(), 1),
              inflow: 0,
              outflow: 0,
              netFlow: 0,
            }
          }
          monthlyFlow[monthYear].outflow += Number(t.totalCost) || 0
        }
      })

    // Labor costs (outflow)
    laborDeployments.forEach((deployment) => {
      const date = new Date(deployment.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyFlow[monthYear]) {
        monthlyFlow[monthYear] = {
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          inflow: 0,
          outflow: 0,
          netFlow: 0,
        }
      }
      monthlyFlow[monthYear].outflow += deployment.totalCost || 0
    })

    // Other expenses (outflow)
    consumableDeployments.forEach((deployment) => {
      const date = new Date(deployment.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyFlow[monthYear]) {
        monthlyFlow[monthYear] = {
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          inflow: 0,
          outflow: 0,
          netFlow: 0,
        }
      }
      monthlyFlow[monthYear].outflow += deployment.amount || 0
    })

    // Calculate net flow
    Object.values(monthlyFlow).forEach((flow) => {
      flow.netFlow = flow.inflow - flow.outflow
    })

    return Object.values(monthlyFlow)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => ({
        month: item.date.toLocaleString("default", { month: "short", year: "2-digit" }),
        inflow: item.inflow,
        outflow: item.outflow,
        netFlow: item.netFlow,
      }))
  }, [transactions, laborDeployments, consumableDeployments])

  const costPerUnitData = React.useMemo(() => {
    const itemCosts: { [key: string]: { totalCost: number; totalQuantity: number; costPerUnit: number } } = {}

    transactions
      .filter((t) => t.transactionType === "Restocking" && t.totalCost)
      .forEach((t) => {
        if (!itemCosts[t.itemType]) {
          itemCosts[t.itemType] = { totalCost: 0, totalQuantity: 0, costPerUnit: 0 }
        }
        itemCosts[t.itemType].totalCost += Number(t.totalCost) || 0
        itemCosts[t.itemType].totalQuantity += Number(t.quantity) || 0
        itemCosts[t.itemType].costPerUnit = itemCosts[t.itemType].totalCost / itemCosts[t.itemType].totalQuantity
      })

    return Object.entries(itemCosts)
      .map(([name, data]) => ({
        name,
        costPerUnit: Math.round(data.costPerUnit * 100) / 100,
        totalCost: data.totalCost,
        totalQuantity: data.totalQuantity,
      }))
      .filter((item) => item.totalCost > 1000) // Only show items with significant cost
      .sort((a, b) => b.costPerUnit - a.costPerUnit)
      .slice(0, 8)
  }, [transactions])

  // Chart configurations
  const inventoryValueConfig: ChartConfig = {
    currentValue: { label: "Current Value (₹)", color: COLORS[0] },
    quantity: { label: "Quantity", color: COLORS[1] },
  }

  const laborEfficiencyConfig: ChartConfig = {
    totalCost: { label: "Total Cost (₹)", color: COLORS[0] },
    avgCost: { label: "Avg Cost (₹)", color: COLORS[1] },
  }

  const turnoverConfig: ChartConfig = {
    restocked: { label: "Restocked", color: COLORS[0] },
    depleted: { label: "Depleted", color: COLORS[1] },
    turnoverRate: { label: "Turnover %", color: COLORS[2] },
  }

  const cashFlowConfig: ChartConfig = {
    inflow: { label: "Inflow", color: COLORS[0] },
    outflow: { label: "Outflow", color: COLORS[1] },
    netFlow: { label: "Net Flow", color: COLORS[2] },
  }

  const costPerUnitConfig: ChartConfig = {
    costPerUnit: { label: "Cost per Unit (₹)", color: COLORS[0] },
  }

  const hasAnyData =
    transactions.length > 0 || inventory.length > 0 || laborDeployments.length > 0 || consumableDeployments.length > 0
  console.log("[v0] Render decision:", {
    hasAnyData,
    topInventoryCount: topInventoryByValue.length,
    laborEfficiencyCount: laborEfficiencyData.length,
    inventoryTurnoverCount: inventoryTurnoverData.length,
    cashFlowCount: cashFlowData.length,
    costPerUnitCount: costPerUnitData.length,
  })

  if (!hasAnyData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                {i === 1
                  ? "Top Inventory by Value"
                  : i === 2
                    ? "Labor Efficiency Analysis"
                    : i === 3
                      ? "Inventory Turnover Rates"
                      : i === 4
                        ? "Monthly Cash Flow"
                        : "Cost per Unit Analysis"}
              </CardTitle>
              <CardDescription>No data available to display insights.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">Please add some data to see insights.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      {/* Top Inventory by Current Value */}
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Top Inventory by Value</CardTitle>
          <CardDescription>Current stock value based on average purchase price and remaining quantity.</CardDescription>
        </CardHeader>
        <CardContent>
          {topInventoryByValue.length > 0 ? (
            <ChartContainer config={inventoryValueConfig} className="h-[250px] w-full">
              <BarChart
                data={topInventoryByValue}
                layout="horizontal"
                margin={{ left: 80, right: 20, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: any, name: string) => [
                    name === "currentValue" ? `₹${Number(value).toLocaleString()}` : `${value} units`,
                    name === "currentValue" ? "Value" : "Quantity",
                  ]}
                />
                <Bar dataKey="currentValue" radius={[0, 4, 4, 0]}>
                  {topInventoryByValue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No inventory value data available.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labor Efficiency by Code */}
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Labor Efficiency Analysis</CardTitle>
          <CardDescription>Cost analysis by expenditure code showing total and average costs.</CardDescription>
        </CardHeader>
        <CardContent>
          {laborEfficiencyData.length > 0 ? (
            <ChartContainer config={laborEfficiencyConfig} className="h-[250px] w-full">
              <BarChart data={laborEfficiencyData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="code" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalCost" fill="var(--color-totalCost)" radius={4} />
                <Bar dataKey="avgCost" fill="var(--color-avgCost)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No labor data available.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Turnover Analysis */}
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Inventory Turnover Rates</CardTitle>
          <CardDescription>Items ranked by turnover percentage (depleted/restocked ratio).</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryTurnoverData.length > 0 ? (
            <ChartContainer config={turnoverConfig} className="h-[250px] w-full">
              <BarChart
                data={inventoryTurnoverData}
                layout="horizontal"
                margin={{ left: 80, right: 20, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: any, name: string) => [
                    name === "turnoverRate" ? `${value}%` : `${value} units`,
                    name === "turnoverRate" ? "Turnover Rate" : name === "restocked" ? "Restocked" : "Depleted",
                  ]}
                />
                <Bar dataKey="turnoverRate" radius={[0, 4, 4, 0]}>
                  {inventoryTurnoverData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No turnover data available.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Cash Flow */}
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
          <CardDescription>Outflow analysis across all expense categories over the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          {cashFlowData.length > 0 ? (
            <ChartContainer config={cashFlowConfig} className="h-[250px] w-full">
              <AreaChart data={cashFlowData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  stackId="1"
                  stroke="var(--color-outflow)"
                  fill="var(--color-outflow)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No cash flow data available.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost per Unit Analysis */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>Cost per Unit Analysis</CardTitle>
          <CardDescription>Average cost per unit for high-value inventory items.</CardDescription>
        </CardHeader>
        <CardContent>
          {costPerUnitData.length > 0 ? (
            <ChartContainer config={costPerUnitConfig} className="h-[250px] w-full">
              <BarChart
                data={costPerUnitData}
                layout="horizontal"
                margin={{ left: 80, right: 20, top: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `₹${value.toFixed(2)}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Cost per Unit"]}
                />
                <Bar dataKey="costPerUnit" radius={[0, 4, 4, 0]}>
                  {costPerUnitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center min-h-[250px]">
              <p className="text-sm text-muted-foreground">No cost per unit data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
