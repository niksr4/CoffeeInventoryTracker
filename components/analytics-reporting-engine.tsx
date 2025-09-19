"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Clock,
  Target,
  Activity,
  Download,
  CalendarIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  Star,
  Briefcase,
} from "lucide-react"
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns"
import { toast } from "@/components/ui/use-toast"

interface AnalyticsData {
  inventory: {
    totalItems: number
    totalValue: number
    lowStockItems: number
    categories: { name: string; value: number; count: number }[]
    trends: { date: string; value: number; items: number }[]
  }
  production: {
    totalOutput: number
    efficiency: number
    qualityScore: number
    trends: { date: string; output: number; quality: number; efficiency: number }[]
    byCategory: { category: string; output: number; target: number }[]
  }
  employees: {
    totalEmployees: number
    activeEmployees: number
    avgPerformance: number
    totalHours: number
    departments: { name: string; count: number; avgPerformance: number }[]
    performance: { date: string; performance: number; hours: number }[]
  }
  tasks: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    completionRate: number
    categories: { category: string; completed: number; total: number }[]
    trends: { date: string; completed: number; created: number }[]
  }
  sensors: {
    totalSensors: number
    onlineSensors: number
    alerts: number
    avgReadings: { type: string; value: number; optimal: boolean }[]
    trends: { date: string; temperature: number; humidity: number; soilMoisture: number }[]
  }
  financial: {
    revenue: number
    expenses: number
    profit: number
    profitMargin: number
    trends: { date: string; revenue: number; expenses: number; profit: number }[]
    categories: { category: string; amount: number; type: "income" | "expense" }[]
  }
}

const generateMockData = (): AnalyticsData => {
  const dates = eachDayOfInterval({
    start: subDays(new Date(), 30),
    end: new Date(),
  })

  const monthlyDates = eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date(),
  })

  return {
    inventory: {
      totalItems: 156,
      totalValue: 45780,
      lowStockItems: 12,
      categories: [
        { name: "Seeds", value: 12500, count: 45 },
        { name: "Tools", value: 8900, count: 23 },
        { name: "Fertilizers", value: 15600, count: 34 },
        { name: "Pesticides", value: 6780, count: 18 },
        { name: "Equipment", value: 2000, count: 36 },
      ],
      trends: dates.map((date, index) => ({
        date: format(date, "MMM dd"),
        value: 45000 + Math.random() * 5000 + index * 50,
        items: 150 + Math.floor(Math.random() * 20) + Math.floor(index / 5),
      })),
    },
    production: {
      totalOutput: 2450,
      efficiency: 87.5,
      qualityScore: 92.3,
      trends: dates.map((date, index) => ({
        date: format(date, "MMM dd"),
        output: 80 + Math.random() * 40,
        quality: 85 + Math.random() * 15,
        efficiency: 80 + Math.random() * 20,
      })),
      byCategory: [
        { category: "Tomatoes", output: 850, target: 900 },
        { category: "Lettuce", output: 650, target: 600 },
        { category: "Peppers", output: 420, target: 450 },
        { category: "Herbs", output: 380, target: 350 },
        { category: "Cucumbers", output: 150, target: 200 },
      ],
    },
    employees: {
      totalEmployees: 24,
      activeEmployees: 22,
      avgPerformance: 4.2,
      totalHours: 1680,
      departments: [
        { name: "Field", count: 8, avgPerformance: 4.1 },
        { name: "Greenhouse", count: 6, avgPerformance: 4.4 },
        { name: "Processing", count: 4, avgPerformance: 4.0 },
        { name: "Management", count: 3, avgPerformance: 4.6 },
        { name: "Maintenance", count: 3, avgPerformance: 4.2 },
      ],
      performance: dates.map((date) => ({
        date: format(date, "MMM dd"),
        performance: 3.8 + Math.random() * 1.2,
        hours: 160 + Math.random() * 40,
      })),
    },
    tasks: {
      totalTasks: 145,
      completedTasks: 128,
      overdueTasks: 8,
      completionRate: 88.3,
      categories: [
        { category: "Planting", completed: 25, total: 28 },
        { category: "Maintenance", completed: 32, total: 35 },
        { category: "Harvesting", completed: 28, total: 30 },
        { category: "Monitoring", completed: 22, total: 25 },
        { category: "Processing", completed: 21, total: 27 },
      ],
      trends: dates.map((date) => ({
        date: format(date, "MMM dd"),
        completed: Math.floor(Math.random() * 8) + 2,
        created: Math.floor(Math.random() * 6) + 3,
      })),
    },
    sensors: {
      totalSensors: 18,
      onlineSensors: 16,
      alerts: 3,
      avgReadings: [
        { type: "Temperature", value: 24.5, optimal: true },
        { type: "Humidity", value: 68, optimal: true },
        { type: "Soil Moisture", value: 35, optimal: false },
        { type: "pH Level", value: 6.8, optimal: true },
        { type: "Light Level", value: 850, optimal: true },
      ],
      trends: dates.map((date) => ({
        date: format(date, "MMM dd"),
        temperature: 20 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        soilMoisture: 30 + Math.random() * 40,
      })),
    },
    financial: {
      revenue: 125000,
      expenses: 89000,
      profit: 36000,
      profitMargin: 28.8,
      trends: monthlyDates.map((date) => ({
        date: format(date, "MMM yyyy"),
        revenue: 8000 + Math.random() * 6000,
        expenses: 6000 + Math.random() * 4000,
        profit: 2000 + Math.random() * 3000,
      })),
      categories: [
        { category: "Crop Sales", amount: 85000, type: "income" as const },
        { category: "Equipment Sales", amount: 25000, type: "income" as const },
        { category: "Consulting", amount: 15000, type: "income" as const },
        { category: "Seeds & Supplies", amount: 35000, type: "expense" as const },
        { category: "Labor", amount: 28000, type: "expense" as const },
        { category: "Equipment", amount: 15000, type: "expense" as const },
        { category: "Utilities", amount: 11000, type: "expense" as const },
      ],
    },
  }
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"]

export default function AnalyticsReportingEngine() {
  const [data, setData] = useState<AnalyticsData>(generateMockData())
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedMetric, setSelectedMetric] = useState("all")
  const [reportType, setReportType] = useState("summary")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const refreshData = () => {
    setData(generateMockData())
    toast({
      title: "Data refreshed",
      description: "Analytics data has been updated with the latest information",
    })
  }

  const generateReport = async () => {
    setIsGeneratingReport(true)
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGeneratingReport(false)
    toast({
      title: "Report generated",
      description: "Your analytics report has been generated and is ready for download",
    })
  }

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color = "text-primary",
  }: {
    title: string
    value: string | number
    change?: { value: number; trend: "up" | "down" }
    icon: any
    color?: string
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {change && (
              <div className="flex items-center space-x-1 mt-1">
                {change.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs ${change.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(change.value)}%
                </span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color.replace("text-", "text-")}/60`} />
        </div>
      </CardContent>
    </Card>
  )

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Analytics & Reporting</h1>
          <p className="text-muted-foreground">Comprehensive insights into your farm operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button size="sm" onClick={generateReport} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Date Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="sensors">Sensors</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Revenue"
              value={`$${data.financial.revenue.toLocaleString()}`}
              change={{ value: 12.5, trend: "up" }}
              icon={DollarSign}
              color="text-green-600"
            />
            <MetricCard
              title="Active Employees"
              value={data.employees.activeEmployees}
              change={{ value: 5.2, trend: "up" }}
              icon={Users}
              color="text-blue-600"
            />
            <MetricCard
              title="Inventory Value"
              value={`$${data.inventory.totalValue.toLocaleString()}`}
              change={{ value: 3.1, trend: "up" }}
              icon={Package}
              color="text-purple-600"
            />
            <MetricCard
              title="Task Completion"
              value={`${data.tasks.completionRate.toFixed(1)}%`}
              change={{ value: 2.8, trend: "up" }}
              icon={Target}
              color="text-orange-600"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue vs Expenses Trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.financial.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Production Output by Category">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.production.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="output" fill="#22c55e" />
                  <Bar dataKey="target" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Employee Performance by Department">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.employees.departments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgPerformance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Inventory Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.inventory.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.inventory.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Alerts & Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Stock Items</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {data.inventory.lowStockItems}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overdue Tasks</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      {data.tasks.overdueTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sensor Alerts</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {data.sensors.alerts}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Performance Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Production Efficiency</span>
                    <span className="font-medium text-green-600">{data.production.efficiency}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quality Score</span>
                    <span className="font-medium text-blue-600">{data.production.qualityScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profit Margin</span>
                    <span className="font-medium text-purple-600">{data.financial.profitMargin}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sensors Online</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {data.sensors.onlineSensors}/{data.sensors.totalSensors}
                      </span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Employees</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {data.employees.activeEmployees}/{data.employees.totalEmployees}
                      </span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Health</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Items" value={data.inventory.totalItems} icon={Package} color="text-blue-600" />
            <MetricCard
              title="Total Value"
              value={`$${data.inventory.totalValue.toLocaleString()}`}
              icon={DollarSign}
              color="text-green-600"
            />
            <MetricCard
              title="Low Stock Items"
              value={data.inventory.lowStockItems}
              icon={AlertTriangle}
              color="text-yellow-600"
            />
            <MetricCard
              title="Categories"
              value={data.inventory.categories.length}
              icon={BarChart3}
              color="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Inventory Value Trend">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.inventory.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Category Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.inventory.categories}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.inventory.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Categories Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.inventory.categories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">{category.count} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${category.value.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        ${(category.value / category.count).toFixed(0)}/item
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Output"
              value={`${data.production.totalOutput} units`}
              icon={Zap}
              color="text-green-600"
            />
            <MetricCard
              title="Efficiency"
              value={`${data.production.efficiency}%`}
              icon={Target}
              color="text-blue-600"
            />
            <MetricCard
              title="Quality Score"
              value={`${data.production.qualityScore}%`}
              icon={Star}
              color="text-yellow-600"
            />
            <MetricCard
              title="Categories"
              value={data.production.byCategory.length}
              icon={BarChart3}
              color="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Production Trends">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.production.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="output" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="quality" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Output vs Target by Category">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.production.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="output" fill="#22c55e" />
                  <Bar dataKey="target" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Employees"
              value={data.employees.totalEmployees}
              icon={Users}
              color="text-blue-600"
            />
            <MetricCard
              title="Active Employees"
              value={data.employees.activeEmployees}
              icon={CheckCircle}
              color="text-green-600"
            />
            <MetricCard
              title="Avg Performance"
              value={`${data.employees.avgPerformance.toFixed(1)}/5.0`}
              icon={Star}
              color="text-yellow-600"
            />
            <MetricCard
              title="Total Hours"
              value={`${data.employees.totalHours}h`}
              icon={Clock}
              color="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Performance by Department">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.employees.departments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="avgPerformance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Employee Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.employees.departments}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.employees.departments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Tasks" value={data.tasks.totalTasks} icon={Briefcase} color="text-blue-600" />
            <MetricCard title="Completed" value={data.tasks.completedTasks} icon={CheckCircle} color="text-green-600" />
            <MetricCard title="Overdue" value={data.tasks.overdueTasks} icon={AlertTriangle} color="text-red-600" />
            <MetricCard
              title="Completion Rate"
              value={`${data.tasks.completionRate.toFixed(1)}%`}
              icon={Target}
              color="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Task Completion Trends">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.tasks.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="completed" stackId="1" stroke="#22c55e" fill="#22c55e" />
                  <Area type="monotone" dataKey="created" stackId="2" stroke="#3b82f6" fill="#3b82f6" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Completion Rate by Category">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.tasks.categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Sensors" value={data.sensors.totalSensors} icon={Activity} color="text-blue-600" />
            <MetricCard title="Online" value={data.sensors.onlineSensors} icon={CheckCircle} color="text-green-600" />
            <MetricCard title="Alerts" value={data.sensors.alerts} icon={AlertTriangle} color="text-yellow-600" />
            <MetricCard title="Uptime" value="98.5%" icon={Zap} color="text-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Environmental Trends">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.sensors.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="soilMoisture" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Current Sensor Readings">
              <div className="space-y-4">
                {data.sensors.avgReadings.map((reading, index) => (
                  <div key={reading.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${reading.optimal ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span className="font-medium">{reading.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{reading.value}</span>
                      <Badge
                        className={reading.optimal ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      >
                        {reading.optimal ? "Optimal" : "Warning"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Revenue"
              value={`$${data.financial.revenue.toLocaleString()}`}
              icon={DollarSign}
              color="text-green-600"
            />
            <MetricCard
              title="Expenses"
              value={`$${data.financial.expenses.toLocaleString()}`}
              icon={TrendingDown}
              color="text-red-600"
            />
            <MetricCard
              title="Profit"
              value={`$${data.financial.profit.toLocaleString()}`}
              icon={TrendingUp}
              color="text-blue-600"
            />
            <MetricCard
              title="Profit Margin"
              value={`${data.financial.profitMargin.toFixed(1)}%`}
              icon={Target}
              color="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Financial Trends">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.financial.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Income vs Expenses">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.financial.categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill={(entry) => (entry.type === "income" ? "#22c55e" : "#ef4444")} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
