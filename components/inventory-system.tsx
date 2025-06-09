"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Brain, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useInventoryData } from "@/hooks/use-inventory-data"
import AIAnalysisPanel from "./ai-analysis-panel"

const data = [
  { name: "Jan", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Mar", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Apr", uv: 2780, pv: 3908, amt: 2000 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100 },
]

export default function InventorySystem() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)

  // Use real inventory data instead of mock data
  const { inventory, transactions, loading, error, lastSync, refreshData, redisConnected } = useInventoryData()

  // Calculate inventory statistics
  const totalValue = inventory.reduce((sum, item) => {
    // Estimate value based on quantity (you can adjust this logic)
    const estimatedPrice = item.unit === "kg" ? 2 : item.unit === "L" ? 5 : 10
    return sum + item.quantity * estimatedPrice
  }, 0)

  const lowStockItems = inventory.filter((item) => {
    // Define low stock thresholds based on unit
    const threshold = item.unit === "kg" ? 100 : item.unit === "L" ? 10 : 5
    return item.quantity <= threshold
  })

  // Get recent transactions (last 10)
  const recentTransactions = transactions.slice(0, 10)

  const handleRefresh = async () => {
    await refreshData(true)
    toast({
      title: "Data Refreshed",
      description: "Inventory data has been updated.",
    })
  }

  if (loading && inventory.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading inventory data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Inventory Value</CardTitle>
            <CardDescription>Estimated value of all items in stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items in Stock</CardTitle>
            <CardDescription>Number of unique items currently in stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items that are running low on stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Overview of sales performance over the last few months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="pv" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge variant={transaction.transactionType === "Restocking" ? "default" : "destructive"}>
                      {transaction.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.itemType}</TableCell>
                  <TableCell>
                    {transaction.quantity} {transaction.unit}
                  </TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.user}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Only show AI Analysis for admin users */}
      {isAdmin && showAIAnalysis && (
        <div className="mt-6">
          <AIAnalysisPanel />
        </div>
      )}

      <Separator className="my-6" />

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Last synced: {lastSync ? lastSync.toLocaleTimeString() : "Never"}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={redisConnected ? "default" : "destructive"}>
              {redisConnected ? "Redis Connected" : "Redis Disconnected"}
            </Badge>
            <Badge variant="secondary">Live Data</Badge>
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sync Inventory
          </Button>
          {/* Only show AI Analysis button for admin users */}
          {isAdmin && (
            <Button
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {showAIAnalysis ? "Hide AI Analysis" : "AI Analysis"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
