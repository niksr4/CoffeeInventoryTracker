"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Package, TrendingUp, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InventoryItem {
  item_type: string
  quantity: number
  total_cost: number
  avg_price: number
  unit: string
}

interface InventorySummary {
  total_inventory_value: number
  total_items: number
  total_quantity: number
}

interface InventoryData {
  inventory: InventoryItem[]
  summary: InventorySummary
  count: number
}

export default function NeonInventoryDisplay() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/inventory-neon")
      const json = await response.json()

      if (json.success) {
        setData(json)
      } else {
        setError(json.message || "Failed to fetch inventory")
      }
    } catch (err: any) {
      setError(err.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading inventory...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Inventory</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.inventory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data</CardTitle>
          <CardDescription>No inventory data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(data.summary.total_items)}</div>
            <p className="text-xs text-muted-foreground">Unique inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(data.summary.total_quantity).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Combined quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(data.summary.total_inventory_value).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Inventory valuation</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>All items from Neon database</CardDescription>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Item Type</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right font-medium">Unit</th>
                  <th className="px-4 py-3 text-right font-medium">Avg Price</th>
                  <th className="px-4 py-3 text-right font-medium">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.inventory.map((item, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{item.item_type}</td>
                    <td className="px-4 py-3 text-right">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline">{item.unit}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">₹{Number(item.avg_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(item.total_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.inventory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No inventory items found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
