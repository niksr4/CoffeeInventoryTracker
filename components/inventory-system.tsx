"use client"

import { useState, useEffect } from "react"
import {
  Download,
  List,
  Clock,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  History,
  Brain,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Users,
  Cloudy,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useRouter } from "next/navigation"
import { useLaborData } from "@/hooks/use-labor-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import type { InventoryItem, Transaction } from "@/lib/inventory-service" // Ensure types are from the correct source
import InventoryValueSummary from "@/components/inventory-value-summary"
import AiAnalysisCharts from "@/components/ai-analysis-charts"
import AccountsPage from "@/components/accounts-page"
import { useInventoryValuation } from "@/hooks/use-inventory-valuation"
import WeatherTab from "@/components/weather-tab"
import TenantDashboardHeader from "@/components/tenant-dashboard-header"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { useTenantInventoryData } from "@/hooks/use-tenant-inventory-data"
import SupplyChainTraceability from "@/components/supply-chain-traceability"

import AdvancedReportingDashboard from "./advanced-reporting-dashboard"
import { EnhancedButton } from "./ui/enhanced-button"
import { ErrorBoundary } from "./ui/error-boundary"
import { TableSkeleton, CardSkeleton } from "./ui/skeleton-loader"
import { EmptyState } from "./ui/empty-state"

// This helper function robustly parses "DD/MM/YYYY HH:MM" strings
const parseCustomDateString = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null
  const parts = dateString.split(" ")
  const dateParts = parts[0].split("/")
  const timeParts = parts[1] ? parts[1].split(":") : ["00", "00"]

  if (dateParts.length !== 3) return null

  const day = Number.parseInt(dateParts[0], 10)
  const month = Number.parseInt(dateParts[1], 10) - 1 // JS months are 0-indexed
  const year = Number.parseInt(dateParts[2], 10)
  const hour = Number.parseInt(timeParts[0], 10)
  const minute = Number.parseInt(timeParts[1], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return null
  }

  const date = new Date(year, month, day, hour, minute)
  // Final check to ensure the created date is valid (e.g., handles non-existent dates)
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return date
  }
  return null
}

const formatDate = (dateString: string) => {
  try {
    const date = parseCustomDateString(dateString)
    if (!date || isNaN(date.getTime())) {
      return dateString // Return original string if parsing fails
    }
    // "en-GB" locale formats as DD/MM/YYYY
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
    const date = parseCustomDateString(dateString)
    if (!date) return false
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
  const { tenant, user, logout, isAdmin } = useTenantAuth()
  const router = useRouter()

  const {
    inventory, // This is InventoryItem[] from Redis via useInventoryData
    transactions,
    addTransaction,
    batchUpdate,
    refreshData,
    loading,
    error: syncError,
    lastSync,
  } = useTenantInventoryData()
  const { deployments: laborDeploymentsRaw } = useLaborData()
  const laborDeployments = Array.isArray(laborDeploymentsRaw) ? laborDeploymentsRaw : []

  const itemValues = useInventoryValuation(transactions)

  const [inventorySortOrder, setInventorySortOrder] = useState<"asc" | "desc" | null>(null)
  const [transactionSortOrder, setTransactionSortOrder] = useState<"desc" | "asc">("desc")
  const [inventorySearchTerm, setInventorySearchTerm] = useState("")
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("")
  const [recentTransactionSearchTerm, setRecentTransactionSearchTerm] = useState("")

  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string>("")

  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false)

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
    selectedUnit: "", // Will be derived from selected item in Redis
    price: "",
  })

  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<{
    name: string
    unit: string
    quantity: string
  }>({
    name: "",
    unit: "kg", // Default unit for new item dialog
    quantity: "0",
  })

  const [editingInventoryItem, setEditingInventoryItem] = useState<{
    name: string
    quantity: number
    unit: string
    originalName: string // To identify the item in Redis if name changes
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
      const activeInventory = inventory.filter((item) => item.quantity > 0)
      const analysisData = {
        inventory: activeInventory, // Send only active inventory
        transactions: transactions.slice(0, 50),
        laborDeployments: laborDeployments.slice(0, 50),
        totalItems: activeInventory.length, // Count only active items
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

    const updatedTransactions = transactions.map((t) => (t.id === editingTransaction.id ? editingTransaction : t))
    const success = await batchUpdate(updatedTransactions) // This should trigger a rebuild on the backend
    if (success) {
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
        variant: "default",
      })
      refreshData(true) // Refresh to get latest state after backend rebuild
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

    // Create a "Item Deleted" type transaction to log the deletion
    const deletionNotification: Transaction = {
      id: `del-${Date.now()}`, // Unique ID for the deletion log
      itemType: transactionToRemove.itemType,
      quantity: transactionToRemove.quantity, // Log the quantity involved
      transactionType: "Item Deleted",
      notes: `Original transaction ID ${transactionToRemove.id} deleted. Notes: ${transactionToRemove.notes}`,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: transactionToRemove.unit,
    }

    // Filter out the transaction to be deleted and add the deletion notification
    const updatedTransactions = [deletionNotification, ...transactions.filter((t) => t.id !== transactionToDelete)]

    const success = await batchUpdate(updatedTransactions) // Send all transactions to backend for rebuild
    if (success) {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been marked as deleted and inventory recalculated.",
        variant: "default",
      })
      refreshData(true)
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
    if (!newItem.name || !newItem.unit) {
      toast({ title: "Missing fields", description: "Please enter item name and unit.", variant: "destructive" })
      return
    }
    const quantity = Number(newItem.quantity)
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid non-negative quantity.",
        variant: "destructive",
      })
      return
    }

    // Check if item already exists in Redis inventory (case-insensitive check recommended for robustness)
    const existingItem = inventory.find((invItem) => invItem.name.toLowerCase() === newItem.name.toLowerCase())
    if (existingItem) {
      toast({
        title: "Item exists",
        description: `Item "${existingItem.name}" already exists. You can adjust its quantity via a transaction.`,
        variant: "destructive",
      })
      setIsNewItemDialogOpen(false)
      return
    }

    setIsAddingItem(true)
    try {
      const transaction: Transaction = {
        id: `new-${Date.now()}`,
        itemType: newItem.name,
        quantity: quantity,
        transactionType: "Restocking", // New items are typically a restocking event
        notes: "New item added to inventory",
        date: generateTimestamp(),
        user: user?.username || "unknown",
        unit: newItem.unit,
      }

      const success = await addTransaction(transaction) // This will update Redis
      if (success) {
        toast({
          title: "Item added",
          description: `Item "${newItem.name}" has been added successfully.`,
          variant: "default",
        })
        refreshData(true) // Refresh data to get the latest state from Redis
        setNewItem({ name: "", unit: "kg", quantity: "0" })
        setIsNewItemDialogOpen(false)
      } else {
        toast({
          title: "Addition failed",
          description: "There was an error adding the new item. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Addition failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleEditInventoryItem = (item: InventoryItem) => {
    setEditingInventoryItem({ ...item, originalName: item.name })
    setIsInventoryEditDialogOpen(true)
  }

  const handleSaveInventoryEdit = async () => {
    if (!editingInventoryItem) return

    const { name, quantity, unit, originalName } = editingInventoryItem

    // Find the original item from the live inventory (Redis data)
    const originalItemInRedis = inventory.find((item) => item.name === originalName)
    if (!originalItemInRedis) {
      toast({
        title: "Update failed",
        description: "Original item not found in current inventory.",
        variant: "destructive",
      })
      setIsInventoryEditDialogOpen(false)
      return
    }

    // If name is changed, check if the new name already exists (and is not the original item)
    if (name.toLowerCase() !== originalName.toLowerCase()) {
      const conflictingItem = inventory.find((invItem) => invItem.name.toLowerCase() === name.toLowerCase())
      if (conflictingItem) {
        toast({
          title: "Name conflict",
          description: `An item named "${conflictingItem.name}" already exists. Please choose a different name.`,
          variant: "destructive",
        })
        return
      }
    }

    const quantityDifference = quantity - originalItemInRedis.quantity
    const unitChanged = unit !== originalItemInRedis.unit
    const nameChanged = name.toLowerCase() !== originalName.toLowerCase() // Case-insensitive comparison for name change detection

    let transactionNotes = ""
    let transactionType: Transaction["transactionType"] = "Restocking" // Default
    let transactionQuantity = 0

    if (nameChanged) {
      transactionNotes += `Item name changed from "${originalName}" to "${name}". `
    }
    if (unitChanged) {
      transactionNotes += `Unit changed from "${originalItemInRedis.unit}" to "${unit}". `
    }
    if (quantityDifference !== 0) {
      transactionNotes += `Quantity adjusted by ${quantityDifference}.`
      transactionType = quantityDifference > 0 ? "Restocking" : "Depleting"
      transactionQuantity = Math.abs(quantityDifference)
    } else if (nameChanged || unitChanged) {
      transactionType = "Unit Change" // Or a new type like "ItemUpdate"
      transactionQuantity = quantity // The full new quantity for "Unit Change" type
      if (!transactionNotes) transactionNotes = "Item details updated."
    }

    if (!transactionNotes) {
      // No actual change
      toast({ title: "No changes", description: "No changes detected for the item.", variant: "default" })
      setIsInventoryEditDialogOpen(false)
      return
    }

    const transaction: Transaction = {
      id: `edit-${Date.now()}`,
      itemType: nameChanged ? name : originalName, // Use new name if it changed, for the transaction log
      quantity: transactionQuantity,
      transactionType: transactionType,
      notes: transactionNotes,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: unit,
    }

    const success = await addTransaction(transaction) // This will add a transaction for the *new* state.

    if (success) {
      toast({
        title: "Item update logged",
        description: "The item changes have been logged. Inventory will reflect after next sync/rebuild.",
        variant: "default",
      })
      refreshData(true) // Crucial to get the latest state
    } else {
      toast({
        title: "Update failed",
        description: "There was an error logging the item update. Please try again.",
        variant: "destructive",
      })
    }
    setEditingInventoryItem(null)
    setIsInventoryEditDialogOpen(false)
  }

  const handleDeleteInventoryItem = async (itemName: string) => {
    // Find the item to delete from the current inventory state
    const itemToDelete = inventory.find((item) => item.name === itemName)
    if (!itemToDelete) {
      toast({
        title: "Deletion failed",
        description: "Item not found in current inventory.",
        variant: "destructive",
      })
      return
    }

    // Confirm before deleting
    if (
      !window.confirm(
        `Are you sure you want to delete item "${itemToDelete.name}"? This will set its quantity to 0 and log the deletion. The item will be hidden from the list.`,
      )
    ) {
      return
    }

    const transaction: Transaction = {
      id: `del-item-${Date.now()}`,
      itemType: itemToDelete.name,
      quantity: itemToDelete.quantity, // Log the quantity that was present
      transactionType: "Item Deleted", // This specific type should be handled by backend to remove the item
      notes: `Item "${itemToDelete.name}" permanently deleted from inventory.`,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: itemToDelete.unit,
    }

    const success = await addTransaction(transaction)
    if (success) {
      toast({
        title: "Item deleted",
        description: `Item "${itemToDelete.name}" has been marked for deletion. Inventory will update.`,
        variant: "default",
      })
      refreshData(true) // Refresh to get updated inventory
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
    setTransactionSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  const exportInventoryToCSV = () => {
    const headers = ["Item Name", "Quantity", "Unit", "Value"]
    // Use live inventory directly for export
    const exportItems = inventory
      .filter((item) => item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
      .sort((a, b) => {
        if (inventorySortOrder === "asc") return a.name.localeCompare(b.name)
        if (inventorySortOrder === "desc") return b.name.localeCompare(a.name)
        return 0
      })

    const rows = exportItems.map((item) => {
      const valueInfo = itemValues[item.name]
      const itemValue = valueInfo ? valueInfo.totalValue : 0
      return [item.name, item.quantity.toString(), item.unit, `₹${itemValue.toFixed(2)}`]
    })
    const totalValue = Object.values(itemValues).reduce((sum, itemVal) => sum + itemVal.totalValue, 0)
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

  // Inventory list is now directly from Redis, filtered and sorted
  const filteredInventory = inventory
    .filter(
      (item) => item.name && item.quantity > 0 && item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (!a.name || !b.name) return 0
      if (inventorySortOrder === "asc") return a.name.localeCompare(b.name)
      if (inventorySortOrder === "desc") return b.name.localeCompare(a.name)
      return 0
    })

  const filteredTransactions = transactions
    .filter((t) => {
      if (!t) return false
      const passesFilterType = filterType === "All Types" || (t.itemType && t.itemType === filterType)
      if (!passesFilterType) return false
      const searchLower = transactionSearchTerm.toLowerCase()
      if (searchLower === "") return true
      const itemMatch = t.itemType ? t.itemType.toLowerCase().includes(searchLower) : false
      const notesMatch = t.notes ? t.notes.toLowerCase().includes(searchLower) : false
      const userMatch = t.user ? t.user.toLowerCase().includes(searchLower) : false
      const typeMatch = t.transactionType ? t.transactionType.toLowerCase().includes(searchLower) : false
      return itemMatch || notesMatch || userMatch || typeMatch
    })
    .sort((a, b) => {
      try {
        const dateA = parseCustomDateString(a.date)
        const dateB = parseCustomDateString(b.date)
        if (!dateA || !dateB) return 0
        if (transactionSortOrder === "asc") {
          return dateA.getTime() - dateB.getTime()
        }
        return dateB.getTime() - dateA.getTime()
      } catch (e) {
        console.error("Error sorting transactions by date:", e, a, b)
        return 0
      }
    })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const validatedCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startIndex = (validatedCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length)
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  useEffect(() => {
    if (currentPage !== validatedCurrentPage) {
      setCurrentPage(validatedCurrentPage)
    }
  }, [currentPage, validatedCurrentPage])

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
        const dateA = parseCustomDateString(a.date)
        const dateB = parseCustomDateString(b.date)
        if (!dateA || !dateB) return 0
        return dateB.getTime() - dateA.getTime()
      } catch (error) {
        return 0
      }
    })

  // Item types for dropdowns are derived from current Redis inventory and transaction history
  const activeItemTypesForDropdown = Array.from(
    new Set(inventory.filter((item) => item.quantity > 0).map((item) => item.name)),
  ).sort()

  const allItemTypesForDropdown = Array.from(
    new Set([...inventory.map((item) => item.name), ...transactions.map((t) => t.itemType)]),
  )
    .sort()
    .filter(Boolean) // Filter out any null or empty strings

  // Get unit for an item directly from Redis inventory state
  const getUnitForItem = (itemName: string): string => {
    const liveItem = inventory.find((item) => item.name === itemName)
    return liveItem && liveItem.unit ? liveItem.unit : "kg" // Fallback unit if not found (should not happen for existing items)
  }

  const exportTransactionsToCSV = () => {
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

  const handleAddTransaction = async () => {
    if (!newTransaction.itemType || !newTransaction.quantity) {
      toast({ title: "Missing fields", description: "Please select item and quantity.", variant: "destructive" })
      return
    }
    const quantity = Number.parseFloat(newTransaction.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Invalid quantity", description: "Quantity must be a positive number.", variant: "destructive" })
      return
    }

    const itemInRedis = inventory.find((item) => item.name === newTransaction.itemType)
    if (!itemInRedis) {
      toast({
        title: "Item not found",
        description: `Item "${newTransaction.itemType}" does not exist in inventory. Add it first.`,
        variant: "destructive",
      })
      return
    }

    setIsAddingTransaction(true)
    try {
      const transaction: Transaction = {
        id: `txn-${Date.now()}`,
        itemType: newTransaction.itemType,
        quantity: quantity,
        transactionType: newTransaction.transactionType,
        notes: newTransaction.notes || "",
        date: generateTimestamp(),
        user: user?.username || "unknown",
        unit: newTransaction.selectedUnit || itemInRedis.unit, // Use selected unit or fallback to item's unit
        ...(newTransaction.transactionType === "Restocking" &&
          newTransaction.price && {
            price: Number.parseFloat(newTransaction.price),
            totalCost: quantity * Number.parseFloat(newTransaction.price),
          }),
      }

      const success = await addTransaction(transaction)
      if (success) {
        toast({
          title: "Transaction recorded",
          description: "The transaction has been recorded successfully.",
          variant: "default",
        })
        refreshData(true)
        setNewTransaction({
          itemType: "",
          quantity: "",
          transactionType: "Depleting",
          notes: "",
          selectedUnit: "",
          price: "",
        })
      } else {
        toast({
          title: "Transaction failed",
          description: "There was an error recording the transaction. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingTransaction(false)
    }
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

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisError("")
    try {
      const activeInventory = inventory.filter((item) => item.quantity > 0)
      const analysisData = {
        inventory: activeInventory,
        transactions: transactions.slice(0, 50),
        laborDeployments: laborDeployments.slice(0, 50),
        totalItems: activeInventory.length,
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

  if (!user) return null

  if (loading && !inventory.length && !syncError) {
    return (
      <ErrorBoundary>
        <div className="w-full px-3 sm:px-4 py-4 sm:py-6 mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <TableSkeleton rows={8} columns={5} />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 mx-auto">
        <div className="max-w-7xl mx-auto">
          <TenantDashboardHeader />

          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-0 sm:flex-row justify-between items-start sm:items-center">
            <div className="text-xs sm:text-sm text-gray-500">
              {syncError ? (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {syncError}
                </span>
              ) : lastSync ? (
                <span>Last synced: {lastSync.toLocaleTimeString()}</span>
              ) : (
                <span>Syncing data...</span>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                loading={isSyncing}
                loadingText="Syncing..."
                icon={<RefreshCw className="h-3 w-3" />}
                className="flex-1 sm:flex-none h-9 bg-transparent"
              >
                Sync Now
              </EnhancedButton>
            </div>
          </div>

          {isAdmin ? (
            <Tabs defaultValue="inventory" className="w-full">
              <div className="w-full overflow-x-auto">
                <TabsList className="flex w-max min-w-full h-12 sm:h-10 p-1 bg-muted rounded-lg">
                  <TabsTrigger value="inventory" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8">
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8"
                  >
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="accounts" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Accounts
                  </TabsTrigger>
                  <TabsTrigger
                    value="traceability"
                    className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8"
                  >
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Traceability
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-analysis"
                    className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8"
                  >
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    AI Analysis
                  </TabsTrigger>
                  <TabsTrigger value="weather" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8">
                    <Cloudy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Weather
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm h-10 sm:h-8">
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="inventory" className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
                <InventoryValueSummary inventory={inventory} transactions={transactions} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-medium text-green-700 flex items-center mb-4 sm:mb-5">
                      <span className="mr-2">+</span> New Inventory Transaction
                    </h2>
                    <div className="border-t border-gray-200 pt-4 sm:pt-5">
                      <div className="mb-4 sm:mb-5">
                        <label className="block text-sm sm:text-base text-gray-700 mb-2">Item Type</label>
                        <Select
                          value={newTransaction.itemType}
                          onValueChange={(value) => {
                            const unit = getUnitForItem(value)
                            setNewTransaction({ ...newTransaction, itemType: value, selectedUnit: unit })
                          }}
                        >
                          <SelectTrigger className="h-11 sm:h-10">
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            {inventory.length > 0 ? (
                              inventory.map((item) => (
                                <SelectItem key={item.name} value={item.name}>
                                  {item.name} ({item.quantity} {item.unit})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No items available - add some first
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                        <div>
                          <label className="block text-sm sm:text-base text-gray-700 mb-2">Quantity</label>
                          <Input
                            type="number"
                            value={newTransaction.quantity}
                            onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                            placeholder="Enter quantity"
                            className="h-11 sm:h-10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base text-gray-700 mb-2">Price (₹)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newTransaction.price}
                            onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })}
                            placeholder="Optional"
                            className="h-11 sm:h-10"
                          />
                        </div>
                      </div>

                      <div className="mb-4 sm:mb-5">
                        <label className="block text-sm sm:text-base text-gray-700 mb-2">Transaction Type</label>
                        <RadioGroup
                          value={newTransaction.transactionType}
                          onValueChange={(value: "Depleting" | "Restocking") =>
                            setNewTransaction({ ...newTransaction, transactionType: value })
                          }
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Depleting" id="depleting" />
                            <Label htmlFor="depleting" className="text-sm sm:text-base">
                              Depleting (Using/Selling)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Restocking" id="restocking" />
                            <Label htmlFor="restocking" className="text-sm sm:text-base">
                              Restocking (Adding)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="mb-4 sm:mb-5">
                        <label className="block text-sm sm:text-base text-gray-700 mb-2">Notes</label>
                        <Textarea
                          value={newTransaction.notes}
                          onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                          placeholder="Optional notes about this transaction"
                          className="min-h-[80px] sm:min-h-[60px] resize-none"
                        />
                      </div>

                      <EnhancedButton
                        onClick={handleAddTransaction}
                        loading={isAddingTransaction}
                        loadingText="Adding Transaction..."
                        className="w-full h-11 sm:h-10 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                        disabled={!newTransaction.itemType || !newTransaction.quantity}
                      >
                        Add Transaction
                      </EnhancedButton>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 gap-3">
                      <h2 className="text-base sm:text-lg font-medium text-green-700 flex items-center">
                        <List className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Current Inventory
                      </h2>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <EnhancedButton
                          variant="default"
                          size="sm"
                          onClick={() => setIsNewItemDialogOpen(true)}
                          icon={<Plus className="h-3 w-3 sm:h-4 sm:w-4" />}
                          className="flex-1 sm:flex-none h-9 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        >
                          Add New Item
                        </EnhancedButton>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportInventoryToCSV}
                          className="flex-1 sm:flex-none h-9 bg-transparent text-xs sm:text-sm"
                        >
                          <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Export
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search inventory..."
                          value={inventorySearchTerm}
                          onChange={(e) => setInventorySearchTerm(e.target.value)}
                          className="pl-10 h-11 sm:h-10"
                        />
                      </div>
                    </div>

                    {filteredInventory.length === 0 ? (
                      <EmptyState
                        icon={<Package className="h-8 w-8" />}
                        title="No inventory items found"
                        description={
                          inventorySearchTerm
                            ? "No items match your search criteria. Try adjusting your search terms."
                            : "Get started by adding your first inventory item."
                        }
                        action={
                          !inventorySearchTerm
                            ? {
                                label: "Add First Item",
                                onClick: () => setIsNewItemDialogOpen(true),
                              }
                            : undefined
                        }
                      />
                    ) : (
                      /* Desktop table layout */
                      <div className="border rounded-md overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gray-50 text-sm font-medium text-gray-500 border-b">
                              <th className="py-4 px-4 text-left">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleInventorySort}
                                  className="flex items-center gap-1 p-0 h-auto font-medium text-gray-500 hover:text-gray-700"
                                >
                                  ITEM NAME
                                  {inventorySortOrder === "asc" ? (
                                    <SortAsc className="h-4 w-4" />
                                  ) : inventorySortOrder === "desc" ? (
                                    <SortDesc className="h-4 w-4" />
                                  ) : null}
                                </Button>
                              </th>
                              <th className="py-4 px-4 text-left">QUANTITY</th>
                              <th className="py-4 px-4 text-left">VALUE</th>
                              <th className="py-4 px-4 text-left">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInventory.map((item) => (
                              <tr key={item.name} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-4 px-4 font-medium">{item.name}</td>
                                <td className="py-4 px-4">
                                  <Badge
                                    variant="outline"
                                    className={
                                      item.quantity <= 5
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : item.quantity <= 20
                                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                          : "bg-green-100 text-green-700 border-green-200"
                                    }
                                  >
                                    {item.quantity} {item.unit}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4">
                                  {itemValues[item.name] ? `₹${itemValues[item.name].toFixed(2)}` : "-"}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex gap-2">
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
                                      onClick={() => handleDeleteInventoryItem(item.name)}
                                      className="text-red-600 p-2 h-auto"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredInventory.length === 0 && (
                          <div className="text-center py-10 text-gray-500">
                            No inventory items found. Add some items to get started.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5">
                    <h2 className="text-base sm:text-lg font-medium text-green-700 flex items-center">
                      <History className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Transaction History
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportTransactionsToCSV}
                      className="w-full sm:w-auto h-9 bg-transparent"
                    >
                      <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Export CSV
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-5">
                    <div className="flex flex-col sm:flex-row gap-3 flex-grow">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search transactions..."
                          value={transactionSearchTerm}
                          onChange={(e) => setTransactionSearchTerm(e.target.value)}
                          className="pl-10 h-11 sm:h-10"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-40 h-11 sm:h-10 border-gray-300">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All Types">All Types</SelectItem>
                          <SelectItem value="Depleting">Depleting</SelectItem>
                          <SelectItem value="Restocking">Restocking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTransactionSort}
                      className="flex items-center gap-1 h-11 sm:h-10 whitespace-nowrap bg-transparent"
                    >
                      {transactionSortOrder === "desc" ? (
                        <>
                          <SortDesc className="h-4 w-4 mr-1" /> Newest First
                        </>
                      ) : (
                        <>
                          <SortAsc className="h-4 w-4 mr-1" /> Oldest First
                        </>
                      )}
                    </Button>
                  </div>

                  {isMobile ? (
                    /* Mobile card-based transaction layout */
                    <div className="space-y-3">
                      {currentTransactions.map((transaction) => (
                        <Card key={transaction.id} className="p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm truncate">{transaction.itemType}</h3>
                                <Badge
                                  variant="outline"
                                  className={
                                    transaction.transactionType === "Depleting"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : transaction.transactionType === "Restocking"
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : transaction.transactionType === "Item Deleted"
                                          ? "bg-gray-100 text-gray-700 border-gray-200"
                                          : "bg-blue-100 text-blue-700 border-blue-200"
                                  }
                                >
                                  {transaction.transactionType}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>{formatDate(transaction.date)}</div>
                                <div>
                                  {transaction.quantity} {transaction.unit}
                                  {transaction.price && ` • ₹${transaction.price.toFixed(2)}`}
                                </div>
                                {transaction.notes && (
                                  <div className="truncate" title={transaction.notes}>
                                    {transaction.notes}
                                  </div>
                                )}
                                <div>By: {transaction.user}</div>
                              </div>
                            </div>
                            {(isAdmin || user?.username === "KAB123") &&
                              transaction.transactionType !== "Item Deleted" &&
                              transaction.transactionType !== "Unit Change" && (
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditTransaction(transaction)}
                                    className="text-amber-600 p-2 h-8 w-8"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteConfirm(transaction.id)}
                                    className="text-red-600 p-2 h-8 w-8"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                          </div>
                        </Card>
                      ))}
                      {currentTransactions.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No transactions found matching your criteria.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Desktop table layout */
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 text-sm font-medium text-gray-500 border-b">
                            <th className="py-4 px-4 text-left">DATE</th>
                            <th className="py-4 px-4 text-left">ITEM TYPE</th>
                            <th className="py-4 px-4 text-left">QUANTITY</th>
                            <th className="py-4 px-4 text-left">TRANSACTION</th>
                            <th className="py-4 px-4 text-left">PRICE</th>
                            <th className="py-4 px-4 text-left">NOTES</th>
                            <th className="py-4 px-4 text-left">USER</th>
                            <th className="py-4 px-4 text-left">ACTIONS</th>
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
                                <Badge
                                  variant="outline"
                                  className={
                                    transaction.transactionType === "Depleting"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : transaction.transactionType === "Restocking"
                                        ? "bg-green-100 text-green-700 border-green-200"
                                        : transaction.transactionType === "Item Deleted"
                                          ? "bg-gray-100 text-gray-700 border-gray-200"
                                          : "bg-blue-100 text-blue-700 border-blue-200"
                                  }
                                >
                                  {transaction.transactionType}
                                </Badge>
                              </td>
                              <td className="py-4 px-4">
                                {transaction.price ? `₹${transaction.price.toFixed(2)}` : "-"}
                              </td>
                              <td className="py-4 px-4 max-w-xs truncate" title={transaction.notes}>
                                {transaction.notes}
                              </td>
                              <td className="py-4 px-4">{transaction.user}</td>
                              <td className="py-4 px-4">
                                {(isAdmin || user?.username === "KAB123") &&
                                  transaction.transactionType !== "Item Deleted" &&
                                  transaction.transactionType !== "Unit Change" && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditTransaction(transaction)}
                                        className="text-amber-600 p-2 h-auto"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteConfirm(transaction.id)}
                                        className="text-red-600 p-2 h-auto"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {currentTransactions.length === 0 && (
                        <div className="text-center py-10 text-gray-500">No transactions recorded yet.</div>
                      )}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                      <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
                        {filteredTransactions.length} transactions
                      </div>
                      <div className="flex gap-2 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="h-9 px-3"
                        >
                          Previous
                        </Button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="h-9 w-9 p-0"
                              >
                                {page}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="h-9 px-3"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ai-analysis" className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                    <h2 className="text-base sm:text-lg font-medium text-green-700 flex items-center">
                      <Brain className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      AI-Powered Analysis
                    </h2>
                    <Button
                      onClick={handleGenerateAnalysis}
                      disabled={isAnalyzing}
                      className="w-full sm:w-auto h-11 sm:h-10 bg-green-600 hover:bg-green-700"
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

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Items</CardTitle>
                        <List className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">
                          {inventory.filter((item) => item.quantity > 0).length}
                        </div>
                        <p className="text-xs text-muted-foreground">with stock</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Transactions</CardTitle>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{transactions.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Recent Activity</CardTitle>
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{recentTransactions.length}</div>
                        <p className="text-xs text-muted-foreground">Last 24 hours</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">
                          {inventory.filter((item) => item.quantity <= 5).length}
                        </div>
                        <p className="text-xs text-muted-foreground">items</p>
                      </CardContent>
                    </Card>
                  </div>

                  {analysisError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-700 text-sm">{analysisError}</p>
                    </div>
                  )}

                  {aiAnalysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
                      <h3 className="font-medium text-blue-900 mb-3 text-sm sm:text-base">
                        AI Insights & Recommendations
                      </h3>
                      <div className="text-blue-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                        {aiAnalysis}
                      </div>
                    </div>
                  )}

                  <AiAnalysisCharts inventory={inventory} transactions={transactions} />

                  {recentTransactions.length > 0 && (
                    <div className="mt-6 sm:mt-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <h3 className="text-base sm:text-lg font-medium text-green-700">
                          Recent Activity (Last 24 Hours)
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3 flex-grow sm:max-w-md">
                          <div className="relative flex-grow">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search recent transactions..."
                              value={recentTransactionSearchTerm}
                              onChange={(e) => setRecentTransactionSearchTerm(e.target.value)}
                              className="pl-10 h-11 sm:h-10"
                            />
                          </div>
                          <Button
                            className="bg-green-600 hover:bg-green-700 h-11 sm:h-10 whitespace-nowrap"
                            onClick={exportRecentTransactionsToCSV}
                          >
                            <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Export
                          </Button>
                        </div>
                      </div>

                      {isMobile ? (
                        /* Mobile recent transactions cards */
                        <div className="space-y-3">
                          {recentTransactions.map((transaction) => (
                            <Card key={transaction.id} className="p-4 border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm truncate">{transaction.itemType}</h4>
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
                                  </div>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>{formatDate(transaction.date)}</div>
                                    <div>
                                      {transaction.quantity} {transaction.unit}
                                    </div>
                                    {transaction.notes && (
                                      <div className="truncate" title={transaction.notes}>
                                        {transaction.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                          {recentTransactions.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              No transactions found in the last 24 hours.
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Desktop recent transactions table */
                        <div className="border rounded-md overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50 text-sm font-medium text-gray-500 border-b">
                                <th className="py-4 px-4 text-left">DATE</th>
                                <th className="py-4 px-4 text-left">ITEM TYPE</th>
                                <th className="py-4 px-4 text-left">QUANTITY</th>
                                <th className="py-4 px-4 text-left">TRANSACTION</th>
                                <th className="py-4 px-4 text-left">NOTES</th>
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
                                  <td className="py-4 px-4 max-w-xs truncate" title={transaction.notes}>
                                    {transaction.notes}
                                  </td>
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
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="accounts" className="space-y-6 pt-6">
                <AccountsPage />
              </TabsContent>
              <TabsContent value="traceability" className="space-y-6 pt-6">
                <SupplyChainTraceability />
              </TabsContent>
              <TabsContent value="weather" className="space-y-6 pt-6">
                <WeatherTab />
              </TabsContent>
              <TabsContent value="analytics" className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
                <AdvancedReportingDashboard inventory={inventory} transactions={transactions} />
              </TabsContent>
            </Tabs>
          ) : (
            /* Enhanced mobile view for non-admin users */
            <div className="space-y-6">
              <InventoryValueSummary inventory={inventory} transactions={transactions} />
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium text-green-700 flex items-center mb-4 sm:mb-5">
                  <List className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Current Inventory
                </h2>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search inventory..."
                      value={inventorySearchTerm}
                      onChange={(e) => setInventorySearchTerm(e.target.value)}
                      className="pl-10 h-11 sm:h-10"
                    />
                  </div>
                </div>

                {filteredInventory.length === 0 ? (
                  <EmptyState
                    icon={<Package className="h-8 w-8" />}
                    title="No inventory items found"
                    description={
                      inventorySearchTerm
                        ? "No items match your search criteria."
                        : "No inventory items are currently available."
                    }
                  />
                ) : (
                  /* Desktop table layout */
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 text-sm font-medium text-gray-500 border-b">
                          <th className="py-4 px-4 text-left">ITEM NAME</th>
                          <th className="py-4 px-4 text-left">QUANTITY</th>
                          <th className="py-4 px-4 text-left">VALUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory.map((item) => (
                          <tr key={item.name} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-4 px-4 font-medium">{item.name}</td>
                            <td className="py-4 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  item.quantity <= 5
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : item.quantity <= 20
                                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                      : "bg-green-100 text-green-700 border-green-200"
                                }
                              >
                                {item.quantity} {item.unit}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              {itemValues[item.name] ? `₹${itemValues[item.name].toFixed(2)}` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredInventory.length === 0 && (
                      <div className="text-center py-10 text-gray-500">No inventory items found.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add New Inventory Item</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new item to track in your inventory. Choose from common units or add your own.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5 py-4">
            <div>
              <Label htmlFor="new-item-name" className="mb-2 block text-sm sm:text-base">
                Item Name *
              </Label>
              <Input
                id="new-item-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Fertilizer, Seeds, Tools"
                className="h-12"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="new-item-unit" className="mb-2 block text-sm sm:text-base">
                Unit of Measurement *
              </Label>
              <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                <SelectTrigger id="new-item-unit" className="h-12">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  <SelectItem value="kg">kg (Kilograms)</SelectItem>
                  <SelectItem value="L">L (Liters)</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                  <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                  <SelectItem value="units">units</SelectItem>
                  <SelectItem value="boxes">boxes</SelectItem>
                  <SelectItem value="bottles">bottles</SelectItem>
                  <SelectItem value="packets">packets</SelectItem>
                  <SelectItem value="tons">tons</SelectItem>
                  <SelectItem value="ml">ml (Milliliters)</SelectItem>
                  <SelectItem value="g">g (Grams)</SelectItem>
                  <SelectItem value="m">m (Meters)</SelectItem>
                  <SelectItem value="ft">ft (Feet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-item-quantity" className="mb-2 block text-sm sm:text-base">
                Initial Quantity
              </Label>
              <Input
                id="new-item-quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                placeholder="Enter starting quantity (default: 0)"
                className="h-12"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave as 0 if you're just setting up the item for future use
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setIsNewItemDialogOpen(false)
                setNewItem({ name: "", unit: "kg", quantity: "0" })
              }}
              className="w-full sm:w-auto h-12 sm:h-11"
              disabled={isAddingItem}
            >
              Cancel
            </Button>
            <EnhancedButton
              onClick={handleAddNewItem}
              loading={isAddingItem}
              loadingText="Adding Item..."
              icon={<Plus className="h-4 w-4" />}
              className="w-full sm:w-auto h-12 sm:h-11 bg-green-600 hover:bg-green-700"
              disabled={!newItem.name || !newItem.unit}
            >
              Add Item
            </EnhancedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Transaction</DialogTitle>
            <DialogDescription className="text-sm">
              Make changes to the transaction. This will update inventory levels accordingly after recalculation.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 sm:space-y-5 py-4">
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <div>
                  <Label htmlFor="edit-item-type" className="mb-2 block text-sm sm:text-base">
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
                      {inventory.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-quantity" className="mb-2 block text-sm sm:text-base">
                      Quantity
                    </Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      value={editingTransaction.quantity}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, quantity: Number.parseFloat(e.target.value) })
                      }
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-price" className="mb-2 block text-sm sm:text-base">
                      Price (₹)
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={editingTransaction.price || ""}
                      onChange={(e) =>
                        setEditingTransaction({ ...editingTransaction, price: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-transaction-type" className="mb-2 block text-sm sm:text-base">
                    Transaction Type
                  </Label>
                  <Select
                    value={editingTransaction.transactionType}
                    onValueChange={(value: "Depleting" | "Restocking") =>
                      setEditingTransaction({ ...editingTransaction, transactionType: value })
                    }
                  >
                    <SelectTrigger id="edit-transaction-type" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Depleting">Depleting (Using/Selling)</SelectItem>
                      <SelectItem value="Restocking">Restocking (Adding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-notes" className="mb-2 block text-sm sm:text-base">
                    Notes
                  </Label>
                  <Textarea
                    id="edit-notes"
                    value={editingTransaction.notes}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto h-12 sm:h-11"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="w-full sm:w-auto h-12 sm:h-11">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete this transaction? This action will be logged and inventory recalculated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialogOpen(false)}
              className="w-full sm:w-auto h-12 sm:h-11"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} className="w-full sm:w-auto h-12 sm:h-11">
              Delete Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInventoryEditDialogOpen} onOpenChange={setIsInventoryEditDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Inventory Item</DialogTitle>
            <DialogDescription className="text-sm">
              Make changes to the inventory item. This will create a transaction record for the changes.
            </DialogDescription>
          </DialogHeader>
          {editingInventoryItem && (
            <div className="space-y-4 sm:space-y-5 py-4">
              <div>
                <Label htmlFor="edit-inventory-name" className="mb-2 block text-sm sm:text-base">
                  Item Name
                </Label>
                <Input
                  id="edit-inventory-name"
                  value={editingInventoryItem.name}
                  onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, name: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-inventory-quantity" className="mb-2 block text-sm sm:text-base">
                    Quantity
                  </Label>
                  <Input
                    id="edit-inventory-quantity"
                    type="number"
                    value={editingInventoryItem.quantity}
                    onChange={(e) =>
                      setEditingInventoryItem({ ...editingInventoryItem, quantity: Number.parseFloat(e.target.value) })
                    }
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-inventory-unit" className="mb-2 block text-sm sm:text-base">
                    Unit
                  </Label>
                  <Select
                    value={editingInventoryItem.unit}
                    onValueChange={(value) => setEditingInventoryItem({ ...editingInventoryItem, unit: value })}
                  >
                    <SelectTrigger id="edit-inventory-unit" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[40vh] overflow-y-auto">
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="bags">bags</SelectItem>
                      <SelectItem value="units">units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsInventoryEditDialogOpen(false)}
              className="w-full sm:w-auto h-12 sm:h-11"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveInventoryEdit} className="w-full sm:w-auto h-12 sm:h-11">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}
