"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, RefreshCw, LayoutDashboard, ListChecks, History, PlusCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useInventoryData } from "@/hooks/use-inventory-data"
import AIAnalysisPanel from "./ai-analysis-panel"
import InventoryTable from "./inventory-table"
import TransactionHistory from "./transaction-history"
import InventoryTransactionForm from "./inventory-transaction-form"

export default function InventorySystem() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Use real inventory data
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Transaction
            </TabsTrigger>
          </TabsList>

          <div className="space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Sync
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

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest inventory changes</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>All items currently in stock</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete record of inventory changes</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <InventoryTransactionForm />
        </TabsContent>
      </Tabs>

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
      </div>
    </div>
  )
}
