"use client"

import { useState, useEffect } from "react"
import {
  Check,
  ChevronDown,
  Download,
  List,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  History,
  RotateCw,
  Brain,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useInventoryData } from "@/hooks/use-inventory-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import type { InventoryItem, Transaction } from "@/lib/inventory-service"
import InventoryValueSummary from "@/components/inventory-value-summary"
import LaborDeploymentTab from "@/components/labor-deployment-tab"
import AiAnalysisCharts from "@/components/ai-analysis-charts"

const itemDefinitions = [
  { name: "UREA", unit: "kg" },
  { name: "MOP", unit: "kg" },
  { name: "DAP", unit: "kg" },
  { name: "MOP white", unit: "kg" },
  { name: "MgSO4", unit: "kg" },
  { name: "MOP+UREA Mix", unit: "bags" },
  { name: "Phosphoric Acid", unit: "L" },
  { name: "Tricel", unit: "L" },
  { name: "Glycil", unit: "L" },
  { name: "Neem oil", unit: "L" },
  { name: "19:19:19", unit: "kg" },
  { name: "Zinc", unit: "L" },
  { name: "Contaf", unit: "L" },
  { name: "NPK Potassium Nitrate", unit: "kg" },
  { name: "Solubor", unit: "kg" },
  { name: "H.S.D", unit: "L" },
  { name: "Petrol", unit: "L" },
  { name: "Rock phosphate", unit: "kg" },
  { name: "Micromin", unit: "kg" },
  { name: "Fix", unit: "L" },
  { name: "Gramaxone", unit: "L" },
  { name: "Polyhalite", unit: "kg" },
]

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${formattedDate} ${formattedTime}`
  } catch (error) {
    return dateString
  }
}

const isWithinLast24Hours = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return date >= twentyFourHoursAgo
  } catch (error) {
    return false
  }
}

const generateTimestamp = () => {
  const now = new Date()
  return (
    now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  )
}

export default function InventorySystem() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()

  const {
    inventory,
    transactions,
    addTransaction,
    batchUpdate,
    rebuildInventory,
    loading,
    error: syncError,
    lastSync,
    refreshData,
  } = useInventoryData()

  const [inventorySortOrder, setInventorySortOrder] = useState<"asc" | "desc" | null>(null)
  const [transactionSortOrder, setTransactionSortOrder] = useState<"asc" | "desc" | null>(null)
  const [inventorySearchTerm, setInventorySearchTerm] = useState("")
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("")
  const [recentTransactionSearchTerm, setRecentTransactionSearchTerm] = useState("")

  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string>("")

  const [newTransaction, setNewTransaction] = useState<{
    itemType: string
    quantity: string
    transactionType: "Depleting" | "Restocking"
    notes: string
    selectedUnit: string
    price: string
  }>({
    itemType: "",
    quantity: "",
    transactionType: "Depleting",
    notes: "",
    selectedUnit: "",
    price: "",
  })

  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<{
    name: string
    unit: string
    quantity: string
  }>({
    name: "",
    unit: "kg",
    quantity: "0",
  })

  const [editingInventoryItem, setEditingInventoryItem] = useState<{
    name: string
    quantity: number
    unit: string
    originalName: string
  } | null>(null)
  const [isInventoryEditDialogOpen, setIsInventoryEditDialogOpen] = useState(false)

  const [filterType, setFilterType] = useState("All Types")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    setCurrentPage(1)
  }, [transactionSearchTerm, filterType])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const generateAIAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisError("")
    try {
      const analysisData = {
        inventory: inventory,
        transactions: transactions.slice(0, 50),
        totalItems: inventory.length,
        totalTransactions: transactions.length,
        recentActivity: transactions.filter((t) => isWithinLast24Hours(t.date)).length,
      }
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisData),
      })
      if (!response.ok) throw new Error("Failed to generate analysis")
      const data = await response.json()
      setAiAnalysis(data.analysis)
    } catch (error) {
      console.error("AI Analysis error:", error)
      setAnalysisError("Failed to generate AI analysis. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction) return
    const originalTransaction = transactions.find((t) => t.id === editingTransaction.id)
    if (!originalTransaction) return
    const updatedTransactions = transactions.map((t) => (t.id === editingTransaction.id ? editingTransaction : t))
    const success = await batchUpdate(updatedTransactions)
    if (success) {
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
        variant: "default",
      })
    } else {
      toast({
        title: "Update failed",
        description: "There was an error updating the transaction. Please try again.",
        variant: "destructive",
      })
    }
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
  }

  const handleDeleteConfirm = (id: string) => {
    setTransactionToDelete(id)
    setDeleteConfirmDialogOpen(true)
  }

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return
    const transactionToRemove = transactions.find((t) => t.id === transactionToDelete)
    if (!transactionToRemove) return
    const deletionNotification: Transaction = {
      id: Date.now().toString(),
      itemType: transactionToRemove.itemType,
      quantity: transactionToRemove.quantity,
      transactionType: "Item Deleted",
      notes: `Transaction deleted: ${transactionToRemove.notes}`,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: transactionToRemove.unit,
    }
    const updatedTransactions = [deletionNotification, ...transactions.filter((t) => t.id !== transactionToDelete)]
    const success = await batchUpdate(updatedTransactions)
    if (success) {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully.",
        variant: "default",
      })
    } else {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the transaction. Please try again.",
        variant: "destructive",
      })
    }
    setDeleteConfirmDialogOpen(false)
    setTransactionToDelete(null)
  }

  const handleAddNewItem = async () => {
    if (!newItem.name || !newItem.unit) return
    const quantity = Number(newItem.quantity)
    if (isNaN(quantity) || quantity < 0) return
    const transaction: Transaction = {
      id: Date.now().toString(),
      itemType: newItem.name,
      quantity: quantity,
      transactionType: "Restocking",
      notes: "Initial stock",
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: newItem.unit,
    }
    if (!itemDefinitions.some((item) => item.name === newItem.name)) {
      itemDefinitions.push({ name: newItem.name, unit: newItem.unit })
    }
    const success = await addTransaction(transaction)
    if (success) {
      toast({ title: "Item added", description: "The new item has been added successfully.", variant: "default" })
    } else {
      toast({
        title: "Addition failed",
        description: "There was an error adding the new item. Please try again.",
        variant: "destructive",
      })
    }
    setNewItem({ name: "", unit: "kg", quantity: "0" })
    setIsNewItemDialogOpen(false)
  }

  const handleEditInventoryItem = (item: InventoryItem) => {
    setEditingInventoryItem({ name: item.name, quantity: item.quantity, unit: item.unit, originalName: item.name })
    setIsInventoryEditDialogOpen(true)
  }

  const handleSaveInventoryEdit = async () => {
    if (!editingInventoryItem) return
    const { name, quantity, unit, originalName } = editingInventoryItem
    const originalItem = inventory.find((item) => item.name === originalName)
    if (!originalItem) return
    const quantityDifference = quantity - originalItem.quantity
    const unitChanged = unit !== originalItem.unit
    const nameChanged = name !== originalName
    const transaction: Transaction = {
      id: Date.now().toString(),
      itemType: originalName,
      quantity: unitChanged ? quantity : Math.abs(quantityDifference),
      transactionType: unitChanged ? "Unit Change" : quantityDifference > 0 ? "Restocking" : "Depleting",
      notes: nameChanged
        ? `Item renamed from "${originalName}" to "${name}"${unitChanged ? ", unit changed" : ""}${quantityDifference !== 0 ? ", quantity adjusted" : ""}`
        : unitChanged
          ? `Unit changed from ${originalItem.unit} to ${unit}${quantityDifference !== 0 ? " and quantity adjusted" : ""}`
          : "Manual inventory adjustment",
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: unit,
    }
    if (nameChanged) {
      const itemDefIndex = itemDefinitions.findIndex((item) => item.name === originalName)
      if (itemDefIndex >= 0) {
        itemDefinitions[itemDefIndex].name = name
      }
    }
    const success = await addTransaction(transaction)
    if (success) {
      toast({
        title: "Item updated",
        description: "The inventory item has been updated successfully.",
        variant: "default",
      })
    } else {
      toast({
        title: "Update failed",
        description: "There was an error updating the inventory item. Please try again.",
        variant: "destructive",
      })
    }
    setEditingInventoryItem(null)
    setIsInventoryEditDialogOpen(false)
  }

  const handleDeleteInventoryItem = async (item: InventoryItem) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      itemType: item.name,
      quantity: item.quantity,
      transactionType: "Item Deleted",
      notes: `Item "${item.name}" removed from inventory`,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: item.unit,
    }
    const success = await addTransaction(transaction)
    if (success) {
      toast({
        title: "Item deleted",
        description: "The inventory item has been deleted successfully.",
        variant: "default",
      })
    } else {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the inventory item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleInventorySort = () => {
    if (inventorySortOrder === null) setInventorySortOrder("asc")
    else if (inventorySortOrder === "asc") setInventorySortOrder("desc")
    else setInventorySortOrder(null)
  }

  const toggleTransactionSort = () => {
    if (transactionSortOrder === null) setTransactionSortOrder("asc")
    else if (transactionSortOrder === "asc") setTransactionSortOrder("desc")
    else setTransactionSortOrder(null)
  }

  const exportInventoryToCSV = () => {
    const calculateInventoryValues = () => {
      const itemValues: Record<string, { quantity: number; totalValue: number; avgPrice: number }> = {}
      const chronologicalTransactions = [...transactions].reverse()
      for (const transaction of chronologicalTransactions) {
        const { itemType, quantity, transactionType, price, totalCost } = transaction
        if (!itemValues[itemType]) itemValues[itemType] = { quantity: 0, totalValue: 0, avgPrice: 0 }
        if (transactionType === "Restocking" && price && totalCost) {
          itemValues[itemType].quantity += quantity
          itemValues[itemType].totalValue += totalCost
          itemValues[itemType].avgPrice = itemValues[itemType].totalValue / itemValues[itemType].quantity
        } else if (transactionType === "Depleting") {
          const depletedValue = quantity * (itemValues[itemType].avgPrice || 0)
          itemValues[itemType].quantity = Math.max(0, itemValues[itemType].quantity - quantity)
          itemValues[itemType].totalValue = Math.max(0, itemValues[itemType].totalValue - depletedValue)
          if (itemValues[itemType].quantity > 0) {
            itemValues[itemType].avgPrice = itemValues[itemType].totalValue / itemValues[itemType].quantity
          } else {
            itemValues[itemType].avgPrice = 0
            itemValues[itemType].totalValue = 0
          }
        }
      }
      return itemValues
    }
    const itemValues = calculateInventoryValues()
    const headers = ["Item Name", "Quantity", "Unit", "Value"]
    const exportItems = filteredAndSortedInventory
    const rows = exportItems.map((item) => {
      const itemValue = itemValues[item.name]?.totalValue || 0
      return [item.name, item.quantity.toString(), item.unit, `₹${itemValue.toFixed(2)}`]
    })
    const totalValue = Object.values(itemValues).reduce((sum, item) => sum + item.totalValue, 0)
    rows.push(["TOTAL", "", "", `₹${totalValue.toFixed(2)}`])
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `inventory-levels-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAndSortedInventory = (() => {
    const allItems = itemDefinitions.map((itemDef) => {
      const existingItem = inventory.find((inv) => inv.name === itemDef.name)
      return { name: itemDef.name, quantity: existingItem ? existingItem.quantity : 0, unit: itemDef.unit }
    })
    return allItems
      .filter((item) => item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
      .sort((a, b) => {
        if (inventorySortOrder === "asc") return a.name.localeCompare(b.name)
        else if (inventorySortOrder === "desc") return b.name.localeCompare(a.name)
        return 0
      })
  })()

  const filteredTransactions = transactions
    .filter((t) => filterType === "All Types" || t.itemType === filterType)
    .filter((t) => {
      const searchLower = transactionSearchTerm.toLowerCase()
      return (
        t.itemType.toLowerCase().includes(searchLower) ||
        t.notes.toLowerCase().includes(searchLower) ||
        t.user.toLowerCase().includes(searchLower) ||
        t.transactionType.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (transactionSortOrder === "asc") return a.itemType.localeCompare(b.itemType)
      else if (transactionSortOrder === "desc") return b.itemType.localeCompare(a.itemType)
      return 0
    })

  const recentTransactions = transactions
    .filter((t) => isWithinLast24Hours(t.date))
    .filter((t) => {
      const searchLower = recentTransactionSearchTerm.toLowerCase()
      return (
        t.itemType.toLowerCase().includes(searchLower) ||
        t.notes.toLowerCase().includes(searchLower) ||
        t.transactionType.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      try {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      } catch (error) {
        return 0
      }
    })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length)
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)
  const itemTypes = itemDefinitions.map((item) => item.name)
  const getUnitForItem = (itemName: string) => {
    const item = itemDefinitions.find((item) => item.name === itemName)
    return item ? item.unit : "kg"
  }

  const exportToCSV = () => {
    const headers = ["Date", "Item Type", "Quantity", "Unit Price", "Total Cost", "Transaction Type", "Notes", "User"]
    const rows = filteredTransactions.map((transaction) => [
      transaction.date,
      transaction.itemType,
      `${transaction.quantity} ${transaction.unit}`,
      transaction.price ? `₹${transaction.price.toFixed(2)}` : "-",
      transaction.totalCost ? `₹${transaction.totalCost.toFixed(2)}` : "-",
      transaction.transactionType,
      transaction.notes,
      transaction.user,
    ])
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transaction-history-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportRecentTransactionsToCSV = () => {
    const headers = ["Date", "Item Type", "Quantity", "Transaction Type", "Notes"]
    const rows = recentTransactions.map((transaction) => [
      transaction.date,
      transaction.itemType,
      `${transaction.quantity} ${transaction.unit}`,
      transaction.transactionType,
      transaction.notes,
    ])
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `recent-transactions-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRecordTransaction = async () => {
    if (!newTransaction.itemType || !newTransaction.quantity || !newTransaction.transactionType) return
    const quantity = Number(newTransaction.quantity)
    if (isNaN(quantity) || quantity <= 0) return
    const transaction: Transaction = {
      id: Date.now().toString(),
      itemType: newTransaction.itemType,
      quantity: quantity,
      transactionType: newTransaction.transactionType,
      notes: newTransaction.notes || "",
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: newTransaction.selectedUnit,
      ...(newTransaction.transactionType === "Restocking" &&
        newTransaction.price && {
          price: Number(newTransaction.price),
          totalCost: quantity * Number(newTransaction.price),
        }),
    }
    const success = await addTransaction(transaction)
    if (success) {
      toast({
        title: "Transaction recorded",
        description: "The transaction has been recorded successfully.",
        variant: "default",
      })
    } else {
      toast({
        title: "Transaction failed",
        description: "There was an error recording the transaction. Please try again.",
        variant: "destructive",
      })
    }
    setNewTransaction({
      itemType: "",
      quantity: "",
      transactionType: "Depleting",
      notes: "",
      selectedUnit: "",
      price: "",
    })
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await refreshData(true)
      toast({
        title: "Sync complete",
        description: "Your inventory data has been synchronized successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "There was an error synchronizing your inventory data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRebuildInventory = async () => {
    setIsRebuilding(true)
    try {
      const success = await rebuildInventory()
      if (success) {
        toast({
          title: "Rebuild complete",
          description: "Your inventory has been rebuilt from transaction history.",
          variant: "default",
        })
      } else {
        toast({
          title: "Rebuild failed",
          description: "There was an error rebuilding your inventory. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsRebuilding(false)
    }
  }

  if (!user) return null
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full px-4 py-6 mx-auto">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-2xl font-medium text-green-700">Honey Farm Inventory System</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 mr-2">
                  {user.role}
                </Badge>
                <span className="text-gray-700">{user.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </header>

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-sm text-gray-500">
              {syncError ? (
                <span className="text-red-500">{syncError}</span>
              ) : lastSync ? (
                <span>Last synced: {lastSync.toLocaleTimeString()}</span>
              ) : (
                <span>Syncing data...</span>
              )}
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRebuildInventory}
                  disabled={isRebuilding}
                  className="flex items-center gap-1"
                >
                  <RotateCw className={`h-3 w-3 ${isRebuilding ? "animate-spin" : ""}`} />
                  {isRebuilding ? "Rebuilding..." : "Rebuild Inventory"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </div>

          {isAdmin ? (
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="flex w-full overflow-x-auto border-b sm:justify-center">
                <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                <TabsTrigger value="labor">
                  <Users className="h-4 w-4 mr-2" />
                  Labor Deployment
                </TabsTrigger>
                <TabsTrigger value="ai-analysis">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inventory" className="space-y-8">
                <InventoryValueSummary inventory={inventory} transactions={transactions} />
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-medium text-green-700 flex items-center mb-5">
                      <span className="mr-2">+</span> New Inventory Transaction
                    </h2>
                    <div className="border-t border-gray-200 pt-5">
                      <div className="mb-5">
                        <label className="block text-gray-700 mb-2">Item Type</label>
                        <Select
                          value={newTransaction.itemType}
                          onValueChange={(value) => {
                            const unit = getUnitForItem(value)
                            setNewTransaction({ ...newTransaction, itemType: value, selectedUnit: unit })
                          }}
                        >
                          <SelectTrigger className="w-full border-gray-300 h-12">
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            {itemTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mb-5">
                        <label className="block text-gray-700 mb-2">Quantity</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="Enter quantity"
                            value={newTransaction.quantity}
                            onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                            className="border-gray-300 pr-12 h-12"
                          />
                          {newTransaction.selectedUnit && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                              {newTransaction.selectedUnit}
                            </div>
                          )}
                        </div>
                      </div>
                      {newTransaction.transactionType === "Restocking" && (
                        <div className="mb-5">
                          <label className="block text-gray-700 mb-2">
                            Price per {newTransaction.selectedUnit || "unit"}
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter price per unit"
                              value={newTransaction.price}
                              onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })}
                              className="border-gray-300 pl-8 h-12"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                              ₹
                            </div>
                            {newTransaction.quantity && newTransaction.price && (
                              <div className="mt-1 text-sm text-gray-600">
                                Total cost: ₹
                                {(Number(newTransaction.quantity) * Number(newTransaction.price)).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mb-5">
                        <label className="block text-gray-700 mb-2">Transaction Type</label>
                        <RadioGroup
                          value={newTransaction.transactionType}
                          onValueChange={(value: "Depleting" | "Restocking") =>
                            setNewTransaction({ ...newTransaction, transactionType: value })
                          }
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Depleting" id="depleting" className="h-5 w-5" />
                            <Label htmlFor="depleting" className="text-base">
                              Depleting
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Restocking" id="restocking" className="h-5 w-5" />
                            <Label htmlFor="restocking" className="text-base">
                              Restocking
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Notes (Optional)</label>
                        <Textarea
                          placeholder="Add any additional details"
                          value={newTransaction.notes}
                          onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                          className="border-gray-300 min-h-[100px]"
                        />
                      </div>
                      <Button
                        onClick={handleRecordTransaction}
                        className="w-full bg-green-700 hover:bg-green-800 text-white h-12 text-base"
                      >
                        <Check className="mr-2 h-5 w-5" /> Record Transaction
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-lg font-medium text-green-700 flex items-center">
                        <List className="mr-2 h-5 w-5" /> Current Inventory Levels
                      </h2>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={exportInventoryToCSV} className="h-10">
                          <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setIsNewItemDialogOpen(true)}
                          className="bg-green-700 hover:bg-green-800 h-10"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add New Item
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search inventory..."
                          value={inventorySearchTerm}
                          onChange={(e) => setInventorySearchTerm(e.target.value)}
                          className="pl-10 h-10"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleInventorySort}
                        className="flex items-center gap-1 h-10 whitespace-nowrap"
                      >
                        {inventorySortOrder === "asc" ? (
                          <>
                            <SortAsc className="h-4 w-4 mr-1" /> Sort A-Z
                          </>
                        ) : inventorySortOrder === "desc" ? (
                          <>
                            <SortDesc className="h-4 w-4 mr-1" /> Sort Z-A
                          </>
                        ) : (
                          <>
                            <SortAsc className="h-4 w-4 mr-1" /> Sort
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="border-t border-gray-200 pt-5">
                      <div className="grid grid-cols-1 gap-4">
                        {(() => {
                          const itemValues: Record<string, { quantity: number; totalValue: number; avgPrice: number }> =
                            {}
                          const chronologicalTransactions = [...transactions].reverse()
                          for (const transaction of chronologicalTransactions) {
                            const { itemType, quantity, transactionType, price, totalCost } = transaction
                            if (!itemValues[itemType])
                              itemValues[itemType] = { quantity: 0, totalValue: 0, avgPrice: 0 }
                            if (transactionType === "Restocking" && price && totalCost) {
                              itemValues[itemType].quantity += quantity
                              itemValues[itemType].totalValue += totalCost
                              itemValues[itemType].avgPrice =
                                itemValues[itemType].totalValue / itemValues[itemType].quantity
                            } else if (transactionType === "Depleting") {
                              const depletedValue = quantity * (itemValues[itemType].avgPrice || 0)
                              itemValues[itemType].quantity = Math.max(0, itemValues[itemType].quantity - quantity)
                              itemValues[itemType].totalValue = Math.max(
                                0,
                                itemValues[itemType].totalValue - depletedValue,
                              )
                              if (itemValues[itemType].quantity > 0) {
                                itemValues[itemType].avgPrice =
                                  itemValues[itemType].totalValue / itemValues[itemType].quantity
                              } else {
                                itemValues[itemType].avgPrice = 0
                                itemValues[itemType].totalValue = 0
                              }
                            }
                          }
                          return filteredAndSortedInventory.map((item, index) => {
                            const itemValue = itemValues[item.name]?.totalValue || 0
                            const avgPrice = itemValues[item.name]?.avgPrice || 0
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center py-4 border-b last:border-0 px-2 hover:bg-gray-50 rounded"
                              >
                                <div className="font-medium text-base">{item.name}</div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-base">
                                      {item.quantity} {item.unit}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      ₹{itemValue.toFixed(2)}{" "}
                                      {avgPrice > 0 && `(avg: ₹${avgPrice.toFixed(2)}/${item.unit})`}
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditInventoryItem(item)}
                                        className="text-amber-600 p-2 h-auto"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteInventoryItem(item)}
                                        className="text-red-600 p-2 h-auto"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                      {filteredAndSortedInventory.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No inventory items found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="transactions" className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-green-700 flex items-center mb-5">
                    <Clock className="mr-2 h-5 w-5" /> Transaction History
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-between mb-5 gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-grow">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search transactions..."
                          value={transactionSearchTerm}
                          onChange={(e) => setTransactionSearchTerm(e.target.value)}
                          className="pl-10 h-10"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-48 border-gray-300 h-10">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[40vh] overflow-y-auto">
                          <SelectItem value="All Types">All Types</SelectItem>
                          {itemTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTransactionSort}
                        className="flex items-center gap-1 h-10 whitespace-nowrap"
                      >
                        {transactionSortOrder === "asc" ? (
                          <>
                            <SortAsc className="h-4 w-4 mr-1" /> Sort A-Z
                          </>
                        ) : transactionSortOrder === "desc" ? (
                          <>
                            <SortDesc className="h-4 w-4 mr-1" /> Sort Z-A
                          </>
                        ) : (
                          <>
                            <SortAsc className="h-4 w-4 mr-1" /> Sort
                          </>
                        )}
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700 h-10" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 text-sm font-medium text-gray-500 border-b">
                          <th className="py-4 px-4 text-left flex items-center">
                            DATE <ChevronDown className="ml-1 h-4 w-4" />
                          </th>
                          <th className="py-4 px-4 text-left">ITEM TYPE</th>
                          <th className="py-4 px-4 text-left">QUANTITY</th>
                          <th className="py-4 px-4 text-left">COST</th>
                          <th className="py-4 px-4 text-left">TRANSACTION</th>
                          {!isMobile && <th className="py-4 px-4 text-left">NOTES</th>}
                          {!isMobile && <th className="py-4 px-4 text-left">USER</th>}
                          <th className="py-4 px-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-4 px-4">{formatDate(transaction.date)}</td>
                            <td className="py-4 px-4">{transaction.itemType}</td>
                            <td className="py-4 px-4">
                              {transaction.quantity} {transaction.unit}
                            </td>
                            <td className="py-4 px-4">
                              {transaction.transactionType === "Restocking" && transaction.price ? (
                                <div>
                                  <div className="font-medium">₹{transaction.totalCost?.toFixed(2)}</div>
                                  <div className="text-sm text-gray-500">
                                    ₹{transaction.price.toFixed(2)}/{transaction.unit}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  transaction.transactionType === "Depleting"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-green-100 text-green-700 border-green-200"
                                }
                              >
                                {transaction.transactionType}
                              </Badge>
                            </td>
                            {!isMobile && <td className="py-4 px-4">{transaction.notes}</td>}
                            {!isMobile && <td className="py-4 px-4">{transaction.user}</td>}
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="text-amber-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteConfirm(transaction.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {currentTransactions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No transactions found matching your search.</div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <div className="text-sm text-gray-500 order-2 sm:order-1">
                      Showing {filteredTransactions.length > 0 ? `${startIndex + 1} to ${endIndex} of` : "0 of"}{" "}
                      {filteredTransactions.length} results
                    </div>
                    <div className="flex gap-3 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        className="text-gray-500 h-10"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        className={currentPage === 1 ? "bg-green-700 h-10" : "text-gray-500 h-10"}
                      >
                        1
                      </Button>
                      <Button
                        variant="outline"
                        className="text-gray-500 h-10"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="labor" className="space-y-6">
                <LaborDeploymentTab />
              </TabsContent>
              <TabsContent value="ai-analysis" className="space-y-6">
                <AiAnalysisCharts inventory={inventory} transactions={transactions} />
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-medium text-green-700 flex items-center">
                        <Brain className="mr-2 h-5 w-5" /> AI Inventory Analysis
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Get AI-powered insights about your inventory patterns and usage trends
                      </p>
                    </div>
                    <Button
                      onClick={generateAIAnalysis}
                      disabled={isAnalyzing}
                      className="bg-green-700 hover:bg-green-800"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Generate Analysis
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{inventory.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{transactions.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{recentTransactions.length}</div>
                        <p className="text-xs text-muted-foreground">Last 24 hours</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {inventory.filter((item) => item.quantity < 10).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Below 10 units</p>
                      </CardContent>
                    </Card>
                  </div>
                  {analysisError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-red-800">{analysisError}</span>
                      </div>
                    </div>
                  )}
                  {aiAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Brain className="mr-2 h-5 w-5" />
                          AI Analysis Results
                        </CardTitle>
                        <CardDescription>
                          Generated insights based on your inventory data and transaction patterns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {!aiAnalysis && !isAnalyzing && !analysisError && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Brain className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Generated Yet</h3>
                        <p className="text-gray-600 text-center mb-4">
                          Click "Generate Analysis" to get AI-powered insights about your inventory patterns, usage
                          trends, and recommendations.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="flex w-full overflow-x-auto border-b sm:justify-center">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="labor">
                  <Users className="h-4 w-4 mr-2" />
                  Labor Deployment
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inventory" className="space-y-8 pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-medium text-green-700 flex items-center mb-5">
                      <span className="mr-2">+</span> New Inventory Transaction
                    </h2>
                    <div className="border-t border-gray-200 pt-5">
                      <div className="mb-5">
                        <label className="block text-gray-700 mb-2">Item Type</label>
                        <Select
                          value={newTransaction.itemType}
                          onValueChange={(value) => {
                            const unit = getUnitForItem(value)
                            setNewTransaction({ ...newTransaction, itemType: value, selectedUnit: unit })
                          }}
                        >
                          <SelectTrigger className="w-full border-gray-300 h-12">
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            {itemTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mb-5">
                        <label className="block text-gray-700 mb-2">Quantity</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="Enter quantity"
                            value={newTransaction.quantity}
                            onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                            className="border-gray-300 pr-12 h-12"
                          />
                          {newTransaction.selectedUnit && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                              {newTransaction.selectedUnit}
                            </div>
                          )}
                        </div>
                      </div>
                      {newTransaction.transactionType === "Restocking" && (
                        <div className="mb-5">
                          <label className="block text-gray-700 mb-2">
                            Price per {newTransaction.selectedUnit || "unit"}
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter price per unit"
                              value={newTransaction.price}
                              onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })}
                              className="border-gray-300 pl-8 h-12"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                              ₹
                            </div>
                            {newTransaction.quantity && newTransaction.price && (
                              <div className="mt-1 text-sm text-gray-600">
                                Total cost: ₹
                                {(Number(newTransaction.quantity) * Number(newTransaction.price)).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mb-5">
                        <label className="block text-gray-700 mb-2">Transaction Type</label>
                        <RadioGroup
                          value={newTransaction.transactionType}
                          onValueChange={(value: "Depleting" | "Restocking") =>
                            setNewTransaction({ ...newTransaction, transactionType: value })
                          }
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Depleting" id="depleting-nonadmin" className="h-5 w-5" />
                            <Label htmlFor="depleting-nonadmin" className="text-base">
                              Depleting
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Restocking" id="restocking-nonadmin" className="h-5 w-5" />
                            <Label htmlFor="restocking-nonadmin" className="text-base">
                              Restocking
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Notes (Optional)</label>
                        <Textarea
                          placeholder="Add any additional details"
                          value={newTransaction.notes}
                          onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                          className="border-gray-300 min-h-[100px]"
                        />
                      </div>
                      <Button
                        onClick={handleRecordTransaction}
                        className="w-full bg-green-700 hover:bg-green-800 text-white h-12 text-base"
                      >
                        <Check className="mr-2 h-5 w-5" /> Record Transaction
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-lg font-medium text-green-700 flex items-center">
                        <List className="mr-2 h-5 w-5" /> Current Inventory Levels
                      </h2>
                      <div className="flex gap-2">
                        {user?.username === "KAB123" && (
                          <Button size="sm" variant="outline" onClick={exportInventoryToCSV} className="h-10">
                            <Download className="mr-2 h-4 w-4" /> Export
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search inventory..."
                          value={inventorySearchTerm}
                          onChange={(e) => setInventorySearchTerm(e.target.value)}
                          className="pl-10 h-10"
                        />
                      </div>
                      {user?.username === "KAB123" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleInventorySort}
                          className="flex items-center gap-1 h-10 whitespace-nowrap"
                        >
                          {inventorySortOrder === "asc" ? (
                            <>
                              <SortAsc className="h-4 w-4 mr-1" /> Sort A-Z
                            </>
                          ) : inventorySortOrder === "desc" ? (
                            <>
                              <SortDesc className="h-4 w-4 mr-1" /> Sort Z-A
                            </>
                          ) : (
                            <>
                              <SortAsc className="h-4 w-4 mr-1" /> Sort
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-5">
                      <div className="grid grid-cols-1 gap-4">
                        {(() => {
                          const itemValues: Record<string, { quantity: number; totalValue: number; avgPrice: number }> =
                            {}
                          const chronologicalTransactions = [...transactions].reverse()
                          for (const transaction of chronologicalTransactions) {
                            const { itemType, quantity, transactionType, price, totalCost } = transaction
                            if (!itemValues[itemType])
                              itemValues[itemType] = { quantity: 0, totalValue: 0, avgPrice: 0 }
                            if (transactionType === "Restocking" && price && totalCost) {
                              itemValues[itemType].quantity += quantity
                              itemValues[itemType].totalValue += totalCost
                              itemValues[itemType].avgPrice =
                                itemValues[itemType].totalValue / itemValues[itemType].quantity
                            } else if (transactionType === "Depleting") {
                              const depletedValue = quantity * (itemValues[itemType].avgPrice || 0)
                              itemValues[itemType].quantity = Math.max(0, itemValues[itemType].quantity - quantity)
                              itemValues[itemType].totalValue = Math.max(
                                0,
                                itemValues[itemType].totalValue - depletedValue,
                              )
                              if (itemValues[itemType].quantity > 0) {
                                itemValues[itemType].avgPrice =
                                  itemValues[itemType].totalValue / itemValues[itemType].quantity
                              } else {
                                itemValues[itemType].avgPrice = 0
                                itemValues[itemType].totalValue = 0
                              }
                            }
                          }
                          return filteredAndSortedInventory.map((item, index) => {
                            const itemValue = itemValues[item.name]?.totalValue || 0
                            const avgPrice = itemValues[item.name]?.avgPrice || 0
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center py-4 border-b last:border-0 px-2 hover:bg-gray-50 rounded"
                              >
                                <div className="font-medium text-base">{item.name}</div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-base">
                                      {item.quantity} {item.unit}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      ₹{itemValue.toFixed(2)}{" "}
                                      {avgPrice > 0 && `(avg: ₹${avgPrice.toFixed(2)}/${item.unit})`}
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditInventoryItem(item)}
                                        className="text-amber-600 p-2 h-auto"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteInventoryItem(item)}
                                        className="text-red-600 p-2 h-auto"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                      {filteredAndSortedInventory.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No inventory items found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {user?.username !== "KAB123" && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-8">
                    <h2 className="text-lg font-medium text-green-700 flex items-center mb-5">
                      <History className="mr-2 h-5 w-5" /> Your Recent Transactions (Last 24 Hours)
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-between mb-5 gap-4">
                      <div className="flex flex-col sm:flex-row gap-3 flex-grow">
                        <div className="relative flex-grow">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search recent transactions..."
                            value={recentTransactionSearchTerm}
                            onChange={(e) => setRecentTransactionSearchTerm(e.target.value)}
                            className="pl-10 h-10"
                          />
                        </div>
                      </div>
                      <Button className="bg-green-600 hover:bg-green-700 h-10" onClick={exportRecentTransactionsToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </Button>
                    </div>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 text-sm font-medium text-gray-500 border-b">
                            <th className="py-4 px-4 text-left">DATE</th>
                            <th className="py-4 px-4 text-left">ITEM TYPE</th>
                            <th className="py-4 px-4 text-left">QUANTITY</th>
                            <th className="py-4 px-4 text-left">TRANSACTION</th>
                            {!isMobile && <th className="py-4 px-4 text-left">NOTES</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {recentTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-4 px-4">{formatDate(transaction.date)}</td>
                              <td className="py-4 px-4">{transaction.itemType}</td>
                              <td className="py-4 px-4">
                                {transaction.quantity} {transaction.unit}
                              </td>
                              <td className="py-4 px-4">
                                <Badge
                                  variant="outline"
                                  className={
                                    transaction.transactionType === "Depleting"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : "bg-green-100 text-green-700 border-green-200"
                                  }
                                >
                                  {transaction.transactionType}
                                </Badge>
                              </td>
                              {!isMobile && <td className="py-4 px-4">{transaction.notes}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {recentTransactions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found in the last 24 hours. Transactions you make will appear here.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="labor" className="space-y-6 pt-6">
                <LaborDeploymentTab />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Make changes to the transaction. This will update inventory levels accordingly.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="edit-item-type" className="mb-2 block">
                    Item Type
                  </Label>
                  <Select
                    value={editingTransaction.itemType}
                    onValueChange={(value) => {
                      const unit = getUnitForItem(value)
                      setEditingTransaction({ ...editingTransaction, itemType: value, unit: unit })
                    }}
                  >
                    <SelectTrigger id="edit-item-type" className="h-12">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[40vh] overflow-y-auto">
                      {itemTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-quantity" className="mb-2 block">
                    Quantity
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-quantity"
                      type="number"
                      value={editingTransaction.quantity}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, quantity: Number(e.target.value) })
                      }
                      className="pr-12 h-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      {editingTransaction.unit}
                    </div>
                  </div>
                </div>
                {editingTransaction.transactionType === "Restocking" && (
                  <div>
                    <Label htmlFor="edit-price" className="mb-2 block">
                      Price per {editingTransaction.unit}
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        value={editingTransaction.price ?? ""}
                        onChange={(e) =>
                          setEditingTransaction({
                            ...editingTransaction,
                            price: Number(e.target.value),
                            totalCost: Number(e.target.value) * editingTransaction.quantity,
                          })
                        }
                        className="pl-8 h-12"
                        placeholder="Enter price per unit"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        ₹
                      </div>
                      {editingTransaction.price && (
                        <div className="mt-1 text-sm text-gray-600">
                          Total cost: ₹{(editingTransaction.quantity * editingTransaction.price).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="edit-transaction-type" className="mb-2 block">
                  Transaction Type
                </Label>
                <RadioGroup
                  id="edit-transaction-type"
                  value={editingTransaction.transactionType}
                  onValueChange={(value: "Depleting" | "Restocking") =>
                    setEditingTransaction({ ...editingTransaction, transactionType: value })
                  }
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="Depleting" id="edit-depleting" className="h-5 w-5" />
                    <Label htmlFor="edit-depleting" className="text-base">
                      Depleting
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="Restocking" id="edit-restocking" className="h-5 w-5" />
                    <Label htmlFor="edit-restocking" className="text-base">
                      Restocking
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="edit-notes" className="mb-2 block">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  value={editingTransaction.notes}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-11">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="w-full sm:w-auto h-11">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This will update inventory levels accordingly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialogOpen(false)}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} className="w-full sm:w-auto h-11">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>Create a new item to track in your inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <Label htmlFor="new-item-name" className="mb-2 block">
                Item Name
              </Label>
              <Input
                id="new-item-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="new-item-unit" className="mb-2 block">
                Unit
              </Label>
              <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                <SelectTrigger id="new-item-unit" className="h-12">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-item-quantity" className="mb-2 block">
                Initial Quantity
              </Label>
              <Input
                id="new-item-quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                placeholder="Enter initial quantity"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsNewItemDialogOpen(false)} className="w-full sm:w-auto h-11">
              Cancel
            </Button>
            <Button onClick={handleAddNewItem} className="w-full sm:w-auto h-11">
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInventoryEditDialogOpen} onOpenChange={setIsInventoryEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update the name, quantity and unit for this inventory item.</DialogDescription>
          </DialogHeader>
          {editingInventoryItem && (
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="edit-inventory-name" className="mb-2 block">
                  Item Name
                </Label>
                <Input
                  id="edit-inventory-name"
                  value={editingInventoryItem.name}
                  onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, name: e.target.value })}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="edit-inventory-quantity" className="mb-2 block">
                  Quantity
                </Label>
                <Input
                  id="edit-inventory-quantity"
                  type="number"
                  value={editingInventoryItem.quantity}
                  onChange={(e) =>
                    setEditingInventoryItem({ ...editingInventoryItem, quantity: Number(e.target.value) })
                  }
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="edit-inventory-unit" className="mb-2 block">
                  Unit
                </Label>
                <Select
                  value={editingInventoryItem.unit}
                  onValueChange={(value) => setEditingInventoryItem({ ...editingInventoryItem, unit: value })}
                >
                  <SelectTrigger id="edit-inventory-unit" className="h-12">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh] overflow-y-auto">
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsInventoryEditDialogOpen(false)}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveInventoryEdit} className="w-full sm:w-auto h-11">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
