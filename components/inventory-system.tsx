"use client"

import { useState, useEffect } from "react"
import {
  Check,
  Download,
  List,
  Clock,
  LogOut,
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
import type { InventoryItem, Transaction } from "@/lib/inventory-service"
import InventoryValueSummary from "@/components/inventory-value-summary"
import AiAnalysisCharts from "@/components/ai-analysis-charts"
import AccountsPage from "@/components/accounts-page"
import { useInventoryValuation } from "@/hooks/use-inventory-valuation"
import WeatherTab from "@/components/weather-tab"

const parseCustomDateString = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null
  const parts = dateString.split(" ")
  const dateParts = parts[0].split("/")
  const timeParts = parts[1] ? parts[1].split(":") : ["00", "00"]

  if (dateParts.length !== 3) return null

  const day = Number.parseInt(dateParts[0], 10)
  const month = Number.parseInt(dateParts[1], 10) - 1
  const year = Number.parseInt(dateParts[2], 10)
  const hour = Number.parseInt(timeParts[0], 10)
  const minute = Number.parseInt(timeParts[1], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return null
  }

  const date = new Date(year, month, day, hour, minute)
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return date
  }
  return null
}

const formatDate = (dateString: string) => {
  try {
    const date = parseCustomDateString(dateString)
    if (!date || isNaN(date.getTime())) {
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
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()

  const {
    inventory,
    summary,
    transactions,
    addTransaction,
    addNewItem,
    batchUpdate,
    refreshData,
    loading,
    error: syncError,
    lastSync,
  } = useInventoryData()
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
    price: number
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
      const activeInventory = inventory
      const analysisData = {
        inventory: activeInventory,
        transactions: transactions.slice(0, 50),
        laborDeployments: laborDeployments.slice(0, 50),
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

    const updatedTransactions = transactions.map((t) => (t.id === editingTransaction.id ? editingTransaction : t))
    const success = await batchUpdate(updatedTransactions)
    if (success) {
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
        variant: "default",
      })
      refreshData(true)
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
      id: `del-${Date.now()}`,
      itemType: transactionToRemove.itemType,
      quantity: transactionToRemove.quantity,
      transactionType: "Item Deleted",
      notes: `Original transaction ID ${transactionToRemove.id} deleted. Notes: ${transactionToRemove.notes}`,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: transactionToRemove.unit,
    }

    const updatedTransactions = [deletionNotification, ...transactions.filter((t) => t.id !== transactionToDelete)]

    const success = await batchUpdate(updatedTransactions)
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

    try {
      await addNewItem({
        name: newItem.name,
        quantity: quantity,
        unit: newItem.unit,
        price: 0,
        user: user?.username || "unknown",
      })

      toast({
        title: "Item added",
        description: `Item "${newItem.name}" has been added successfully.`,
        variant: "default",
      })
      setNewItem({ name: "", unit: "kg", quantity: "0" })
      setIsNewItemDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Addition failed",
        description: error.message || "There was an error adding the new item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditInventoryItem = (item: InventoryItem) => {
    const valueInfo = itemValues[item.name]
    const currentPrice = valueInfo?.avgPrice || 0
    setEditingInventoryItem({
      ...item,
      originalName: item.name,
      price: currentPrice,
    })
    setIsInventoryEditDialogOpen(true)
  }

  const handleSaveInventoryEdit = async () => {
    if (!editingInventoryItem) return

    const { name, quantity, unit, originalName } = editingInventoryItem

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
    const nameChanged = name.toLowerCase() !== originalName.toLowerCase()
    const valueInfo = itemValues[originalName]
    const currentPrice = valueInfo?.avgPrice || 0
    const priceChanged = editingInventoryItem.price !== currentPrice && editingInventoryItem.price > 0

    let transactionNotes = ""
    let transactionType: Transaction["transactionType"] = "Restocking"
    let transactionQuantity = 0
    const transactionPrice = editingInventoryItem.price

    if (nameChanged) {
      transactionNotes += `Item name changed from "${originalName}" to "${name}". `
    }
    if (unitChanged) {
      transactionNotes += `Unit changed from "${originalItemInRedis.unit}" to "${unit}". `
    }
    if (priceChanged) {
      transactionNotes += `Price updated from ₹${currentPrice.toFixed(2)} to ₹${editingInventoryItem.price.toFixed(2)}. `
    }

    if (quantityDifference !== 0) {
      transactionNotes += `Quantity adjusted by ${quantityDifference}.`
      transactionType = quantityDifference > 0 ? "Restocking" : "Depleting"
      transactionQuantity = Math.abs(quantityDifference)
    } else if (nameChanged || unitChanged || priceChanged) {
      transactionType = "Unit Change"
      transactionQuantity = quantity
      if (!transactionNotes) transactionNotes = "Item details updated."
    }

    if (!transactionNotes) {
      toast({ title: "No changes", description: "No changes detected for the item.", variant: "default" })
      setIsInventoryEditDialogOpen(false)
      return
    }

    const transaction: Transaction = {
      id: `edit-${Date.now()}`,
      itemType: nameChanged ? name : originalName,
      quantity: transactionQuantity,
      transactionType: transactionType,
      notes: transactionNotes,
      date: generateTimestamp(),
      user: user?.username || "unknown",
      unit: unit,
      price: transactionPrice,
      totalCost: transactionQuantity * transactionPrice,
    }

    const success = await addTransaction(transaction)

    if (success) {
      toast({
        title: "Item update logged",
        description: "The item changes have been logged. Inventory will reflect after next sync/rebuild.",
        variant: "default",
      })
      refreshData(true)
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

  const handleDeleteInventoryItem = async (itemToDelete: InventoryItem) => {
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
      quantity: itemToDelete.quantity,
      transactionType: "Item Deleted",
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
      refreshData(true)
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
    const exportItems = inventory
      .filter((item) => item.name && item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
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

  const filteredAndSortedInventory = inventory
    .filter((item) => item.name && item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()))
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

  const activeItemTypesForDropdown = Array.from(
    new Set(inventory.filter((item) => item.quantity > 0).map((item) => item.name)),
  ).sort()

  const allItemTypesForDropdown = Array.from(
    new Set([...inventory.map((item) => item.name), ...transactions.map((t) => t.itemType)]),
  )
    .sort()
    .filter(Boolean)

  const getUnitForItem = (itemName: string): string => {
    const liveItem = inventory.find((item) => item.name === itemName)
    return liveItem && liveItem.unit ? liveItem.unit : "kg"
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
    if (!newTransaction.itemType || !newTransaction.quantity || !newTransaction.transactionType) {
      toast({ title: "Missing fields", description: "Please select item, quantity, and type.", variant: "destructive" })
      return
    }
    const quantity = Number(newTransaction.quantity)
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

    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
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
      refreshData(true)
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

  if (!user) return null
  if (loading && !inventory.length && !syncError) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  const showTransactionHistory = isAdmin || user?.username === "KAB123"

  // --- START OF UPDATED CODE ---
  // const [lastSynced, setLastSynced] = useState<Date>(new Date()) // This state is not used elsewhere. Removed.
  // The existing `isSyncing` state handles this functionality.
  const handleSync = async () => {
    // Renamed from handleManualSync for clarity
    setIsSyncing(true)
    // Simulate a network request or data fetching
    // await new Promise((resolve) => setTimeout(resolve, 1000)) // Removed simulated delay
    // setLastSynced(new Date()) // This state is not used. Removed.
    // In a real app, you'd call refreshData() or similar here
    await refreshData(true) // Retain original functionality, but ensure it's awaited
    toast({
      title: "Sync complete",
      description: "Your inventory data has been synchronized successfully.",
      variant: "default",
    })
    setIsSyncing(false) // Ensure setIsSyncing is set to false after the async operation completes
  }
  // --- END OF UPDATED CODE ---

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
                <span className="text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {syncError}
                </span>
              ) : lastSync ? (
                <span>Last synced: {lastSync.toLocaleTimeString()}</span>
              ) : (
                <span>Syncing data...</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync} // Use the updated handleSync function
                disabled={isSyncing}
                className="flex items-center gap-1 bg-transparent"
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
                <TabsTrigger value="accounts">
                  <Users className="h-4 w-4 mr-2" />
                  Accounts
                </TabsTrigger>
                <TabsTrigger value="ai-analysis">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="weather">
                  <Cloudy className="h-4 w-4 mr-2" />
                  Weather
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inventory" className="space-y-8">
                <InventoryValueSummary inventory={inventory} transactions={transactions} summary={summary} />
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
                            {activeItemTypesForDropdown.map((type) => (
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={exportInventoryToCSV}
                          className="h-10 bg-transparent"
                        >
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
                        className="flex items-center gap-1 h-10 whitespace-nowrap bg-transparent"
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
                        {filteredAndSortedInventory.map((item, index) => {
                          const valueInfo = itemValues[item.name]
                          const itemValue = valueInfo ? valueInfo.totalValue : 0
                          const avgPrice = valueInfo ? valueInfo.avgPrice : 0
                          return (
                            <div
                              key={`${item.name}-${index}`}
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
                                    {avgPrice > 0 && `(avg: ₹${avgPrice.toFixed(2)}/${item.unit || "unit"})`}
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
                        })}
                      </div>
                      {filteredAndSortedInventory.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {inventorySearchTerm
                            ? "No items match your search."
                            : "Inventory is empty or not yet loaded."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="transactions" className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-medium text-green-700 flex items-center">
                      <History className="mr-2 h-5 w-5" /> Transaction History
                    </h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={exportToCSV} className="h-10 bg-transparent">
                        <Download className="mr-2 h-4 w-4" /> Export
                      </Button>
                    </div>
                  </div>
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
                        <SelectTrigger className="w-full sm:w-40 h-10 border-gray-300">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[40vh] overflow-y-auto">
                          <SelectItem value="All Types">All Types</SelectItem>
                          {allItemTypesForDropdown.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTransactionSort}
                      className="flex items-center gap-1 h-10 whitespace-nowrap bg-transparent"
                    >
                      {transactionSortOrder === "desc" ? (
                        <>
                          <SortDesc className="h-4 w-4 mr-1" /> Date: Newest First
                        </>
                      ) : (
                        <>
                          <SortAsc className="h-4 w-4 mr-1" /> Date: Oldest First
                        </>
                      )}
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
                          {!isMobile && (
                            <>
                              <th className="py-4 px-4 text-left">PRICE</th>
                              <th className="py-4 px-4 text-left">NOTES</th>
                              <th className="py-4 px-4 text-left">USER</th>
                            </>
                          )}
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
                            {!isMobile && (
                              <>
                                <td className="py-4 px-4">
                                  {transaction.price ? `₹${transaction.price.toFixed(2)}` : "-"}
                                </td>
                                <td className="py-4 px-4 max-w-xs truncate" title={transaction.notes}>
                                  {transaction.notes}
                                </td>
                                <td className="py-4 px-4">{transaction.user}</td>
                              </>
                            )}
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
                    {transactions.length === 0 && (
                      <div className="text-center py-10 text-gray-500">No transactions recorded yet.</div>
                    )}
                    {transactions.length > 0 && filteredTransactions.length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        No transactions found matching your current filters.
                      </div>
                    )}
                  </div>
                  {filteredTransactions.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-500">
                        Showing {Math.min(startIndex + 1, filteredTransactions.length)} to {endIndex} of{" "}
                        {filteredTransactions.length} transactions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || totalPages === 0}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="accounts" className="space-y-6">
                <AccountsPage />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Unique Items</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{inventory.length}</div>
                        <p className="text-xs text-muted-foreground">items in total</p>
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
              <TabsContent value="weather" className="space-y-6">
                <WeatherTab />
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="flex w-full overflow-x-auto border-b sm:justify-center">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                {showTransactionHistory && <TabsTrigger value="transactions">Transaction History</TabsTrigger>}
                <TabsTrigger value="accounts">
                  <Users className="h-4 w-4 mr-2" />
                  Accounts
                </TabsTrigger>
                <TabsTrigger value="weather">
                  <Cloudy className="h-4 w-4 mr-2" />
                  Weather
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
                            {activeItemTypesForDropdown.map((type) => (
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={exportInventoryToCSV}
                            className="h-10 bg-transparent"
                          >
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
                          className="flex items-center gap-1 h-10 whitespace-nowrap bg-transparent"
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
                        {filteredAndSortedInventory.map((item, index) => {
                          const valueInfo = itemValues[item.name]
                          const itemValue = valueInfo ? valueInfo.totalValue : 0
                          const avgPrice = valueInfo ? valueInfo.avgPrice : 0
                          return (
                            <div
                              key={`${item.name}-${index}`}
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
                                    {avgPrice > 0 && `(avg: ₹${avgPrice.toFixed(2)}/${item.unit || "unit"})`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {filteredAndSortedInventory.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {inventorySearchTerm
                            ? "No items match your search."
                            : "Inventory is empty or not yet loaded."}
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
                              {!isMobile && (
                                <td className="py-4 px-4 max-w-xs truncate" title={transaction.notes}>
                                  {transaction.notes}
                                </td>
                              )}
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
              {showTransactionHistory && (
                <TabsContent value="transactions" className="space-y-6 pt-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-lg font-medium text-green-700 flex items-center">
                        <History className="mr-2 h-5 w-5" /> Transaction History
                      </h2>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={exportToCSV} className="h-10 bg-transparent">
                          <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                      </div>
                    </div>
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
                          <SelectTrigger className="w-full sm:w-40 h-10 border-gray-300">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[40vh] overflow-y-auto">
                            <SelectItem value="All Types">All Types</SelectItem>
                            {allItemTypesForDropdown.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTransactionSort}
                        className="flex items-center gap-1 h-10 whitespace-nowrap bg-transparent"
                      >
                        {transactionSortOrder === "desc" ? (
                          <>
                            <SortDesc className="h-4 w-4 mr-1" /> Date: Newest First
                          </>
                        ) : (
                          <>
                            <SortAsc className="h-4 w-4 mr-1" /> Date: Oldest First
                          </>
                        )}
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
                            {!isMobile && (
                              <>
                                <th className="py-4 px-4 text-left">PRICE</th>
                                <th className="py-4 px-4 text-left">NOTES</th>
                                <th className="py-4 px-4 text-left">USER</th>
                              </>
                            )}
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
                              {!isMobile && (
                                <>
                                  <td className="py-4 px-4">
                                    {transaction.price ? `₹${transaction.price.toFixed(2)}` : "-"}
                                  </td>
                                  <td className="py-4 px-4 max-w-xs truncate" title={transaction.notes}>
                                    {transaction.notes}
                                  </td>
                                  <td className="py-4 px-4">{transaction.user}</td>
                                </>
                              )}
                              <td className="py-4 px-4">
                                {user?.username === "KAB123" &&
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
                      {transactions.length === 0 && (
                        <div className="text-center py-10 text-gray-500">No transactions recorded yet.</div>
                      )}
                      {transactions.length > 0 && filteredTransactions.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                          No transactions found matching your current filters.
                        </div>
                      )}
                    </div>
                    {filteredTransactions.length > 0 && (
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                          Showing {Math.min(startIndex + 1, filteredTransactions.length)} to {endIndex} of{" "}
                          {filteredTransactions.length} transactions
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
              <TabsContent value="accounts" className="space-y-6 pt-6">
                <AccountsPage />
              </TabsContent>
              <TabsContent value="weather" className="space-y-6 pt-6">
                <WeatherTab />
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
              Make changes to the transaction. This will update inventory levels accordingly after recalculation.
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
                      {allItemTypesForDropdown.map((type) => (
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
                      Price per {editingTransaction.unit || "unit"}
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
                      {editingTransaction.price && editingTransaction.quantity > 0 && (
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
              Are you sure you want to delete this transaction? This action will be logged and inventory recalculated.
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
              Delete Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Create a new item to track in your inventory. It will appear in item lists after being added.
            </DialogDescription>
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
                placeholder="Enter unique item name"
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
                  <SelectItem value="units">units</SelectItem>
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
                placeholder="Enter initial quantity (e.g., 0)"
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
            <DialogTitle>Edit Inventory Item Details</DialogTitle>
            <DialogDescription>
              Update name, quantity, or unit. Changes are logged as transactions and inventory is recalculated.
            </DialogDescription>
          </DialogHeader>
          {editingInventoryItem && (
            <div className="space-y-5 py-4">
              <div>
                <Label className="mb-2 block text-sm text-gray-600">
                  Original Name: {editingInventoryItem.originalName}
                </Label>
              </div>
              <div>
                <Label htmlFor="edit-inventory-name" className="mb-2 block">
                  Item Name
                </Label>
                <Input
                  id="edit-inventory-name"
                  value={editingInventoryItem.name}
                  onChange={(e) => setEditingInventoryItem({ ...editingInventoryItem, name: e.target.value })}
                  className="h-12"
                  placeholder="Enter new name if changing"
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
                    <SelectItem value="units">units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-inventory-price" className="mb-2 block">
                  Price per {editingInventoryItem.unit || "unit"}
                </Label>
                <div className="relative">
                  <Input
                    id="edit-inventory-price"
                    type="number"
                    step="0.01"
                    value={editingInventoryItem.price}
                    onChange={(e) =>
                      setEditingInventoryItem({ ...editingInventoryItem, price: Number(e.target.value) })
                    }
                    className="pl-8 h-12"
                    placeholder="Enter price per unit"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    ₹
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current avg price: ₹{(itemValues[editingInventoryItem.originalName]?.avgPrice || 0).toFixed(2)}
                </p>
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
