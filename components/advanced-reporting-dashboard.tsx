"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, TrendingUp, Calendar, DollarSign, Package, Bell } from "lucide-react"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { InventoryItem, Transaction } from "@/lib/inventory-service"
import { useLaborData } from "@/hooks/use-labor-data"
import { useConsumablesData } from "@/hooks/use-consumables-data"
import AiAnalysisCharts from "./ai-analysis-charts"

interface AdvancedReportingDashboardProps {
  inventory: InventoryItem[]
  transactions: Transaction[]
}

const COLORS = [
  "#059669",
  "#dc2626",
  "#2563eb",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#65a30d",
  "#4338ca",
  "#0d9488",
  "#f59e0b",
  "#ef4444",
]

export default function AdvancedReportingDashboard({ inventory, transactions }: AdvancedReportingDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [alertThreshold, setAlertThreshold] = useState("10")
  const { deployments: laborDeployments } = useLaborData()
  const { deployments: consumableDeployments } = useConsumablesData()

  const lowStockAlerts = useMemo(() => {
    const threshold = Number.parseInt(alertThreshold)
    return inventory
      .filter((item) => item.quantity <= threshold)
      .sort((a, b) => a.quantity - b.quantity)
      .map((item) => ({
        ...item,
        severity: item.quantity === 0 ? "critical" : item.quantity <= threshold / 2 ? "high" : "medium",
      }))
  }, [inventory, alertThreshold])

  const profitLossData = useMemo(() => {
    const periodDays = Number.parseInt(selectedPeriod)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    let totalRevenue = 0
    let totalCosts = 0

    // Calculate costs from inventory restocking
    const inventoryCosts = transactions
      .filter((t) => {
        const transactionDate = new Date(t.date.split(" ")[0].split("/").reverse().join("-"))
        return t.transactionType === "Restocking" && t.totalCost && transactionDate >= cutoffDate
      })
      .reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0)

    // Calculate labor costs
    const laborCosts = laborDeployments
      .filter((d) => {
        const deploymentDate = new Date(d.date)
        return deploymentDate >= cutoffDate
      })
      .reduce((sum, d) => sum + (d.totalCost || 0), 0)

    // Calculate consumable costs
    const consumableCosts = consumableDeployments
      .filter((d) => {
        const deploymentDate = new Date(d.date)
        return deploymentDate >= cutoffDate
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0)

    totalCosts = inventoryCosts + laborCosts + consumableCosts

    // For now, revenue is estimated from depleted inventory (would need sales data in real app)
    const estimatedRevenue = transactions
      .filter((t) => {
        const transactionDate = new Date(t.date.split(" ")[0].split("/").reverse().join("-"))
        return t.transactionType === "Depleting" && transactionDate >= cutoffDate
      })
      .reduce((sum, t) => {
        // Estimate revenue at 150% of average cost
        const avgCost =
          inventoryCosts / Math.max(1, transactions.filter((tr) => tr.transactionType === "Restocking").length)
        return sum + Number(t.quantity) * avgCost * 1.5
      }, 0)

    totalRevenue = estimatedRevenue

    return {
      revenue: totalRevenue,
      costs: totalCosts,
      profit: totalRevenue - totalCosts,
      margin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0,
      breakdown: {
        inventory: inventoryCosts,
        labor: laborCosts,
        consumables: consumableCosts,
      },
    }
  }, [transactions, laborDeployments, consumableDeployments, selectedPeriod])

  const seasonalTrends = useMemo(() => {
    const monthlyData: { [key: string]: { month: string; restocking: number; depleting: number; costs: number } } = {}

    transactions.forEach((t) => {
      const date = new Date(t.date.split(" ")[0].split("/").reverse().join("-"))
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, restocking: 0, depleting: 0, costs: 0 }
      }

      if (t.transactionType === "Restocking") {
        monthlyData[monthKey].restocking += Number(t.quantity) || 0
        monthlyData[monthKey].costs += Number(t.totalCost) || 0
      } else if (t.transactionType === "Depleting") {
        monthlyData[monthKey].depleting += Number(t.quantity) || 0
      }
    })

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
  }, [transactions])

  const costAnalysis = useMemo(() => {
    const categories = [
      { name: "Inventory", value: profitLossData.breakdown.inventory, color: COLORS[0] },
      { name: "Labor", value: profitLossData.breakdown.labor, color: COLORS[1] },
      { name: "Consumables", value: profitLossData.breakdown.consumables, color: COLORS[2] },
    ].filter((cat) => cat.value > 0)

    return categories
  }, [profitLossData])

  const chartConfigs: { [key: string]: ChartConfig } = {
    profitLoss: {
      revenue: { label: "Revenue (₹)", color: COLORS[0] },
      costs: { label: "Costs (₹)", color: COLORS[1] },
      profit: { label: "Profit (₹)", color: COLORS[2] },
    },
    seasonal: {
      restocking: { label: "Restocking", color: COLORS[0] },
      depleting: { label: "Depleting", color: COLORS[1] },
      costs: { label: "Costs (₹)", color: COLORS[2] },
    },
    costs: {
      value: { label: "Amount (₹)", color: COLORS[0] },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights and alerts for your operation</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={alertThreshold} onValueChange={setAlertThreshold}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Alert at 5 units</SelectItem>
              <SelectItem value="10">Alert at 10 units</SelectItem>
              <SelectItem value="20">Alert at 20 units</SelectItem>
              <SelectItem value="50">Alert at 50 units</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="profitloss" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Low Stock Alerts ({lowStockAlerts.length})
              </CardTitle>
              <CardDescription>Items that need attention based on current stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockAlerts.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            item.severity === "critical"
                              ? "bg-red-500"
                              : item.severity === "high"
                                ? "bg-orange-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Current: {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.severity === "critical"
                            ? "destructive"
                            : item.severity === "high"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {item.severity === "critical"
                          ? "Out of Stock"
                          : item.severity === "high"
                            ? "Very Low"
                            : "Low Stock"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All items are well stocked!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitloss" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{profitLossData.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last {selectedPeriod} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{profitLossData.costs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitLossData.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{profitLossData.profit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{profitLossData.profit >= 0 ? "Profit" : "Loss"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitLossData.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {profitLossData.margin.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Margin</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Distribution of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {costAnalysis.length > 0 ? (
                <ChartContainer config={chartConfigs.costs} className="h-[300px] w-full">
                  <BarChart data={costAnalysis}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={4}>
                      {costAnalysis.map((entry, index) => (
                        <Bar key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cost data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Activity Trends</CardTitle>
              <CardDescription>Monthly patterns in inventory activity over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              {seasonalTrends.length > 0 ? (
                <ChartContainer config={chartConfigs.seasonal} className="h-[400px] w-full">
                  <LineChart data={seasonalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="restocking"
                      stroke="var(--color-restocking)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="depleting"
                      stroke="var(--color-depleting)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Not enough historical data to show trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AiAnalysisCharts inventory={inventory} transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
