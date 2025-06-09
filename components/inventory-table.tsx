"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowUpDown } from "lucide-react"
import { useInventoryData } from "@/hooks/use-inventory-data"

export default function InventoryTable() {
  const { inventory } = useInventoryData()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof (typeof inventory)[0] | null
    direction: "ascending" | "descending"
  }>({
    key: null,
    direction: "ascending",
  })

  // Filter inventory based on search term
  const filteredInventory = inventory.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Sort inventory based on sort config
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (!sortConfig.key) return 0

    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Request sort for a column
  const requestSort = (key: keyof (typeof inventory)[0]) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get sort direction indicator
  const getSortDirectionIndicator = (key: keyof (typeof inventory)[0]) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "ascending" ? "↑" : "↓"
  }

  // Determine if an item is low on stock
  const isLowStock = (item: (typeof inventory)[0]) => {
    const threshold = item.unit === "kg" ? 100 : item.unit === "L" ? 10 : 5
    return item.quantity <= threshold
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("name")}
                  className="flex items-center gap-1 p-0 font-medium"
                >
                  Item Name {getSortDirectionIndicator("name")}
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("quantity")}
                  className="flex items-center gap-1 p-0 font-medium"
                >
                  Quantity {getSortDirectionIndicator("quantity")}
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInventory.length > 0 ? (
              sortedInventory.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.quantity.toLocaleString()}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    {isLowStock(item) ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="outline">In Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
