"use client"

import { useState, useEffect } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useRouter } from "next/navigation"
import { useLaborData } from "@/hooks/use-labor-data"
import { toast } from "@/components/ui/use-toast"
import type { InventoryItem, Transaction } from "@/lib/types" // Ensure types are from the correct source
import { useInventoryValuation } from "@/hooks/use-inventory-valuation"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { useTenantInventoryData } from "@/hooks/use-tenant-inventory-data"
import HRManagementSystem from "./hr-management-system"
import FarmMappingSystem from "./farm-mapping-system"
import TaskPlanningSystem from "./task-planning-system"
import FarmFlowDashboard from "./farmflow-dashboard"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploadingCsv, setIsUploadingCsv] = useState(false)
  const [csvUploadError, setCsvUploadError] = useState<string>("")

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
  const [activeTab, setActiveTab] = useState("dashboard")

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
    return liveItem ? liveItem.unit : ""
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="farmflow">FarmFlow</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="mapping">Farm Map</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
          </TabsList>

          {/* ... existing tab contents ... */}

          <TabsContent value="farmflow" className="space-y-6">
            <FarmFlowDashboard />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskPlanningSystem />
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <FarmMappingSystem />
          </TabsContent>

          <TabsContent value="hr" className="space-y-6">
            <HRManagementSystem />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
