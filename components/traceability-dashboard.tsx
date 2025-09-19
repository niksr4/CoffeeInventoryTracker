"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Package, CheckCircle, TrendingUp, MapPin, AlertTriangle, Download, BarChart3 } from "lucide-react"
import { useTraceabilityData } from "@/hooks/use-traceability-data"
import { formatDate } from "@/lib/traceability-service"

const COLORS = ["#059669", "#dc2626", "#2563eb", "#ea580c", "#7c3aed", "#0891b2", "#be185d", "#65a30d"]

export default function TraceabilityDashboard() {
  const { batches, hives, qualityCheckpoints, getQualityCheckpointsForBatch, getHiveById } = useTraceabilityData()

  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [selectedHive, setSelectedHive] = useState<string>("all")

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const periodDays = Number.parseInt(selectedPeriod)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    const recentBatches = batches.filter((batch) => new Date(batch.harvestDate) >= cutoffDate)

    const totalQualityChecks = qualityCheckpoints.length
    const passedChecks = qualityCheckpoints.filter((qc) => qc.passed).length
    const failedChecks = totalQualityChecks - passedChecks

    const activeBatches = batches.filter((b) => ["active", "processing"].includes(b.status)).length
    const completedBatches = batches.filter((b) => ["packaged", "shipped", "sold"].includes(b.status)).length

    return {
      totalBatches: batches.length,
      recentBatches: recentBatches.length,
      activeBatches,
      completedBatches,
      totalQualityChecks,
      passedChecks,
      failedChecks,
      passRate: totalQualityChecks > 0 ? Math.round((passedChecks / totalQualityChecks) * 100) : 0,
      totalQuantity: batches.reduce((sum, b) => sum + b.quantityCurrent, 0),
    }
  }, [batches, qualityCheckpoints, selectedPeriod])

  // Batch status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts: { [key: string]: number } = {}
    batches.forEach((batch) => {
      statusCounts[batch.status] = (statusCounts[batch.status] || 0) + 1
    })

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: Math.round((count / batches.length) * 100),
    }))
  }, [batches])

  // Quality trends over time
  const qualityTrends = useMemo(() => {
    const monthlyData: { [key: string]: { month: string; passed: number; failed: number; total: number } } = {}

    qualityCheckpoints.forEach((qc) => {
      const date = new Date(qc.inspectionDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthName, passed: 0, failed: 0, total: 0 }
      }

      monthlyData[monthKey].total += 1
      if (qc.passed) {
        monthlyData[monthKey].passed += 1
      } else {
        monthlyData[monthKey].failed += 1
      }
    })

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }, [qualityCheckpoints])

  // Hive performance analysis
  const hivePerformance = useMemo(() => {
    const hiveData: { [key: string]: { hive: string; batches: number; totalQuantity: number; avgQuality: number } } = {}

    batches.forEach((batch) => {
      if (batch.sourceHiveId) {
        const hive = getHiveById(batch.sourceHiveId)
        if (hive) {
          const key = hive.hiveNumber
          if (!hiveData[key]) {
            hiveData[key] = { hive: key, batches: 0, totalQuantity: 0, avgQuality: 0 }
          }
          hiveData[key].batches += 1
          hiveData[key].totalQuantity += batch.quantityInitial

          // Calculate average quality score based on checkpoints
          const checkpoints = getQualityCheckpointsForBatch(batch.id)
          const passRate =
            checkpoints.length > 0 ? (checkpoints.filter((qc) => qc.passed).length / checkpoints.length) * 100 : 0
          hiveData[key].avgQuality = (hiveData[key].avgQuality + passRate) / 2
        }
      }
    })

    return Object.values(hiveData)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 8)
  }, [batches, getHiveById, getQualityCheckpointsForBatch])

  // Product type analysis
  const productAnalysis = useMemo(() => {
    const productData: { [key: string]: { product: string; batches: number; quantity: number } } = {}

    batches.forEach((batch) => {
      if (!productData[batch.productType]) {
        productData[batch.productType] = { product: batch.productType, batches: 0, quantity: 0 }
      }
      productData[batch.productType].batches += 1
      productData[batch.productType].quantity += batch.quantityCurrent
    })

    return Object.values(productData).sort((a, b) => b.quantity - a.quantity)
  }, [batches])

  // Recent quality issues
  const recentIssues = useMemo(() => {
    return qualityCheckpoints
      .filter((qc) => !qc.passed && qc.issuesFound)
      .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
      .slice(0, 5)
  }, [qualityCheckpoints])

  // Chart configurations
  const chartConfigs: { [key: string]: ChartConfig } = {
    qualityTrends: {
      passed: { label: "Passed", color: COLORS[0] },
      failed: { label: "Failed", color: COLORS[1] },
      total: { label: "Total", color: COLORS[2] },
    },
    hivePerformance: {
      totalQuantity: { label: "Total Quantity (kg)", color: COLORS[0] },
      avgQuality: { label: "Avg Quality (%)", color: COLORS[1] },
    },
    productAnalysis: {
      quantity: { label: "Quantity (kg)", color: COLORS[0] },
      batches: { label: "Batches", color: COLORS[1] },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Traceability Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive analytics and reporting for supply chain traceability</p>
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.recentBatches} in last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.passRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.passedChecks}/{metrics.totalQualityChecks} checks passed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeBatches}</div>
            <p className="text-xs text-muted-foreground">{metrics.completedBatches} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQuantity.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Current inventory</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Batch Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Status Distribution</CardTitle>
                <CardDescription>Current status of all batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusDistribution.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                        <Badge variant="outline">{item.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product Type Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Product Analysis</CardTitle>
                <CardDescription>Breakdown by product type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigs.productAnalysis} className="h-[250px] w-full">
                  <BarChart data={productAnalysis}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="product"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(value) => `${value}kg`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Quality Issues */}
          {recentIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Recent Quality Issues
                </CardTitle>
                <CardDescription>Quality checkpoints that failed in recent inspections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentIssues.map((issue) => {
                    const batch = batches.find((b) => b.id === issue.batchId)
                    return (
                      <div key={issue.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {batch?.batchNumber} - {issue.checkpointType}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Inspector: {issue.inspectorName} • {formatDate(issue.inspectionDate)}
                          </div>
                          <div className="text-sm text-red-600">{issue.issuesFound}</div>
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid gap-6">
            {/* Quality Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
                <CardDescription>Quality checkpoint results over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {qualityTrends.length > 0 ? (
                  <ChartContainer config={chartConfigs.qualityTrends} className="h-[300px] w-full">
                    <LineChart data={qualityTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="passed"
                        stroke="var(--color-passed)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="failed"
                        stroke="var(--color-failed)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quality data available for the selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          {/* Hive Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Hive Performance</CardTitle>
              <CardDescription>Production analysis by source hive</CardDescription>
            </CardHeader>
            <CardContent>
              {hivePerformance.length > 0 ? (
                <ChartContainer config={chartConfigs.hivePerformance} className="h-[300px] w-full">
                  <BarChart data={hivePerformance}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="hive" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => `${value}kg`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalQuantity" fill="var(--color-totalQuantity)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hive performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
              <CardDescription>Regulatory compliance and audit trail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{metrics.passRate}%</div>
                  <div className="text-sm text-muted-foreground">Quality Compliance</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{batches.length}</div>
                  <div className="text-sm text-muted-foreground">Traceable Batches</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{qualityCheckpoints.length}</div>
                  <div className="text-sm text-muted-foreground">Quality Records</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Compliance Status: Good</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  All batches have complete traceability records and meet quality standards.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
