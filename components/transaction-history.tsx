"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowUpDown, Calendar } from "lucide-react"
import { useInventoryData } from "@/hooks/use-inventory-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TransactionHistory() {
  const { transactions } = useInventoryData()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | null>("All Types") // Updated default value
  const [sortConfig, setSortConfig] = useState<{
    key: keyof (typeof transactions)[0] | null
    direction: "ascending" | "descending"
  }>({
    key: "date",
    direction: "descending",
  })

  // Filter transactions based on search term and filter type
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !filterType || transaction.transactionType === filterType

    return matchesSearch && matchesType
  })

  // Sort transactions based on sort config
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortConfig.key) return 0

    if (sortConfig.key === "date") {
      return sortConfig.direction === "ascending"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    }

    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Request sort for a column
  const requestSort = (key: keyof (typeof transactions)[0]) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Get sort direction indicator
  const getSortDirectionIndicator = (key: keyof (typeof transactions)[0]) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "ascending" ? "↑" : "↓"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType || ""} onValueChange={(value) => setFilterType(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Types">All Types</SelectItem>
              <SelectItem value="Restocking">Restocking</SelectItem>
              <SelectItem value="Depleting">Depleting</SelectItem>
              <SelectItem value="Item Deleted">Item Deleted</SelectItem>
              <SelectItem value="Unit Change">Unit Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("date")}
                  className="flex items-center gap-1 p-0 font-medium"
                >
                  Date {getSortDirectionIndicator("date")}
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("itemType")}
                  className="flex items-center gap-1 p-0 font-medium"
                >
                  Item {getSortDirectionIndicator("itemType")}
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="hidden md:table-cell">User</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.itemType}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.transactionType === "Restocking"
                          ? "default"
                          : transaction.transactionType === "Depleting"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {transaction.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.quantity} {transaction.unit}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{transaction.user}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">{transaction.notes}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
