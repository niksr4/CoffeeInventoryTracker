"use client"

import { useState } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Calendar,
  Users,
  DollarSign,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useLaborData } from "@/hooks/use-labor-data"
import type { LaborDeployment } from "@/hooks/use-labor-data"

// Labor categories with codes
const LABOR_CATEGORIES = [
  { code: "101a", name: "Writer Wage & Benefits", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { code: "101b", name: "Supervisor", color: "bg-green-100 text-green-800 border-green-200" },
  { code: "102", name: "Land preparation", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { code: "103", name: "Planting", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { code: "104", name: "Weeding", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { code: "105", name: "Fertilizer application", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { code: "106", name: "Pruning", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { code: "107", name: "Pest and disease control", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { code: "108", name: "Harvesting", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { code: "109", name: "Post-harvest handling", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { code: "110", name: "Infrastructure maintenance", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { code: "111", name: "Equipment maintenance", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { code: "112", name: "Transportation", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { code: "113", name: "Marketing and sales", color: "bg-lime-100 text-lime-800 border-lime-200" },
  { code: "114", name: "Administration", color: "bg-green-100 text-green-800 border-green-200" },
  { code: "115", name: "Training and capacity building", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { code: "116", name: "Quality control", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { code: "117", name: "Research and development", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { code: "118", name: "Environmental management", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { code: "119", name: "Community engagement", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { code: "120", name: "Record keeping", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { code: "121", name: "Irrigation", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { code: "122", name: "Shade management", color: "bg-green-100 text-green-800 border-green-200" },
  { code: "123", name: "Soil conservation", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { code: "124", name: "Nursery management", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { code: "125", name: "Coffee processing", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { code: "126", name: "Storage management", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { code: "127", name: "Packaging", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { code: "128", name: "Certification compliance", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { code: "129", name: "Financial management", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { code: "130", name: "Supply chain management", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { code: "131", name: "Technology adoption", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { code: "132", name: "Safety and health", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { code: "133", name: "Waste management", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { code: "134", name: "Energy management", color: "bg-lime-100 text-lime-800 border-lime-200" },
  { code: "135", name: "Water management", color: "bg-green-100 text-green-800 border-green-200" },
  { code: "136", name: "Climate adaptation", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { code: "137", name: "Biodiversity conservation", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { code: "138", name: "Social responsibility", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { code: "139", name: "Innovation and improvement", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { code: "140", name: "Other Expenses", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { code: "141", name: "Arabica processing and drying", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
]

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

// Helper function to generate timestamp
const generateTimestamp = () => {
  const now = new Date()
  return now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function LaborDeploymentTab() {
  const {
    deployments,
    addDeployment,
    updateDeployment,
    deleteDeployment,
    loading,
    error: syncError,
    lastSync,
    refreshData,
  } = useLaborData()

  // Form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState<LaborDeployment | null>(null)
  const [deploymentToDelete, setDeploymentToDelete] = useState<string | null>(null)

  const [newDeployment, setNewDeployment] = useState({
    date: generateTimestamp(),
    category: "",
    workers: "",
    hours: "",
    hourlyRate: "",
    notes: "",
  })

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [dateFilter, setDateFilter] = useState("All Dates")

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false)

  // Reset form
  const resetForm = () => {
    setNewDeployment({
      date: generateTimestamp(),
      category: "",
      workers: "",
      hours: "",
      hourlyRate: "",
      notes: "",
    })
  }

  // Handle add deployment
  const handleAddDeployment = async () => {
    if (!newDeployment.category || !newDeployment.workers || !newDeployment.hours || !newDeployment.hourlyRate) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const workers = Number(newDeployment.workers)
    const hours = Number(newDeployment.hours)
    const hourlyRate = Number(newDeployment.hourlyRate)

    if (isNaN(workers) || workers <= 0 || isNaN(hours) || hours <= 0 || isNaN(hourlyRate) || hourlyRate <= 0) {
      toast({
        title: "Invalid values",
        description: "Please enter valid positive numbers for workers, hours, and hourly rate.",
        variant: "destructive",
      })
      return
    }

    const deployment: Omit<LaborDeployment, "id"> = {
      date: newDeployment.date,
      category: newDeployment.category,
      workers: workers,
      hours: hours,
      hourlyRate: hourlyRate,
      totalCost: workers * hours * hourlyRate,
      notes: newDeployment.notes || "",
    }

    const success = await addDeployment(deployment)

    if (success) {
      toast({
        title: "Deployment added",
        description: "Labor deployment has been recorded successfully.",
        variant: "default",
      })
      resetForm()
      setIsAddDialogOpen(false)
    } else {
      toast({
        title: "Failed to add deployment",
        description: "There was an error recording the labor deployment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle edit deployment
  const handleEditDeployment = (deployment: LaborDeployment) => {
    setEditingDeployment({ ...deployment })
    setIsEditDialogOpen(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingDeployment) return

    if (
      !editingDeployment.category ||
      !editingDeployment.workers ||
      !editingDeployment.hours ||
      !editingDeployment.hourlyRate
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (editingDeployment.workers <= 0 || editingDeployment.hours <= 0 || editingDeployment.hourlyRate <= 0) {
      toast({
        title: "Invalid values",
        description: "Please enter valid positive numbers for workers, hours, and hourly rate.",
        variant: "destructive",
      })
      return
    }

    // Recalculate total cost
    const updatedDeployment = {
      ...editingDeployment,
      totalCost: editingDeployment.workers * editingDeployment.hours * editingDeployment.hourlyRate,
    }

    const success = await updateDeployment(updatedDeployment)

    if (success) {
      toast({
        title: "Deployment updated",
        description: "Labor deployment has been updated successfully.",
        variant: "default",
      })
      setIsEditDialogOpen(false)
      setEditingDeployment(null)
    } else {
      toast({
        title: "Failed to update deployment",
        description: "There was an error updating the labor deployment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = (id: string) => {
    setDeploymentToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete deployment
  const handleDeleteDeployment = async () => {
    if (!deploymentToDelete) return

    const success = await deleteDeployment(deploymentToDelete)

    if (success) {
      toast({
        title: "Deployment deleted",
        description: "Labor deployment has been deleted successfully.",
        variant: "default",
      })
    } else {
      toast({
        title: "Failed to delete deployment",
        description: "There was an error deleting the labor deployment. Please try again.",
        variant: "destructive",
      })
    }

    setIsDeleteDialogOpen(false)
    setDeploymentToDelete(null)
  }

  // Handle manual sync
  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await refreshData(true)
      toast({
        title: "Sync complete",
        description: "Your labor deployment data has been synchronized successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "There was an error synchronizing your labor deployment data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Category", "Workers", "Hours", "Hourly Rate", "Total Cost", "Notes"]
    const rows = deployments.map((deployment) => [
      deployment.date,
      getCategoryName(deployment.category),
      deployment.workers.toString(),
      deployment.hours.toString(),
      `₹${deployment.hourlyRate.toFixed(2)}`,
      `₹${deployment.totalCost.toFixed(2)}`,
      deployment.notes || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `labor-deployments-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get category name by code
  const getCategoryName = (code: string) => {
    const category = LABOR_CATEGORIES.find((cat) => cat.code === code)
    return category ? `${category.code} - ${category.name}` : code
  }

  // Get category color by code
  const getCategoryColor = (code: string) => {
    const category = LABOR_CATEGORIES.find((cat) => cat.code === code)
    return category ? category.color : "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Filter deployments
  const filteredDeployments = deployments
    .filter((deployment) => {
      const matchesSearch =
        deployment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(deployment.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
        deployment.notes.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "All Categories" || deployment.category === categoryFilter

      const matchesDate = dateFilter === "All Dates" || deployment.date.includes(dateFilter)

      return matchesSearch && matchesCategory && matchesDate
    })
    .sort((a, b) => {
      // Sort by date descending (newest first)
      try {
        const dateA = new Date(a.date.split("/").reverse().join("-"))
        const dateB = new Date(b.date.split("/").reverse().join("-"))
        return dateB.getTime() - dateA.getTime()
      } catch (error) {
        return 0
      }
    })

  // Calculate summary statistics
  const totalWorkers = filteredDeployments.reduce((sum, deployment) => sum + deployment.workers, 0)
  const totalHours = filteredDeployments.reduce((sum, deployment) => sum + deployment.hours, 0)
  const totalCost = filteredDeployments.reduce((sum, deployment) => sum + deployment.totalCost, 0)
  const averageHourlyRate =
    filteredDeployments.length > 0
      ? filteredDeployments.reduce((sum, deployment) => sum + deployment.hourlyRate, 0) / filteredDeployments.length
      : 0

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading labor deployment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-green-700 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Labor Deployment Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">Track and manage labor deployment across different activities</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-transparent"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
          <Button size="sm" variant="outline" onClick={exportToCSV} disabled={deployments.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="bg-green-700 hover:bg-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Add Deployment
          </Button>
        </div>
      </div>

      {/* Sync status */}
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{syncError}</p>
        </div>
      )}

      {lastSync && <div className="text-xs text-gray-500">Last synced: {lastSync.toLocaleTimeString()}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkers}</div>
            <p className="text-xs text-muted-foreground">Across all deployments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">Total work hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total labor cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageHourlyRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Average rate per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="max-h-[40vh] overflow-y-auto">
            <SelectItem value="All Categories">All Categories</SelectItem>
            {LABOR_CATEGORIES.map((category) => (
              <SelectItem key={category.code} value={category.code}>
                {category.code} - {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deployments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Labor Deployments</h3>
          {filteredDeployments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium">No labor deployments found</p>
              <p className="text-sm">Add your first labor deployment to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={getCategoryColor(deployment.category)}>
                          {getCategoryName(deployment.category)}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(deployment.date)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Workers:</span>
                          <span className="ml-1 font-medium">{deployment.workers}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Hours:</span>
                          <span className="ml-1 font-medium">{deployment.hours}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Rate:</span>
                          <span className="ml-1 font-medium">₹{deployment.hourlyRate.toFixed(2)}/hr</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <span className="ml-1 font-medium text-green-600">₹{deployment.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                      {deployment.notes && (
                        <div className="mt-2 text-sm text-gray-600 flex items-start">
                          <FileText className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{deployment.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditDeployment(deployment)}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteConfirm(deployment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Deployment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Labor Deployment</DialogTitle>
            <DialogDescription>Record a new labor deployment for tracking purposes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-date">Date</Label>
              <Input
                id="add-date"
                type="date"
                value={newDeployment.date.split("/").reverse().join("-")}
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  setNewDeployment({
                    ...newDeployment,
                    date: date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }),
                  })
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-category">Category</Label>
              <Select
                value={newDeployment.category}
                onValueChange={(value) => setNewDeployment({ ...newDeployment, category: value })}
              >
                <SelectTrigger id="add-category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh] overflow-y-auto">
                  {LABOR_CATEGORIES.map((category) => (
                    <SelectItem key={category.code} value={category.code}>
                      {category.code} - {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-workers">Workers</Label>
                <Input
                  id="add-workers"
                  type="number"
                  min="1"
                  value={newDeployment.workers}
                  onChange={(e) => setNewDeployment({ ...newDeployment, workers: e.target.value })}
                  placeholder="Number of workers"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="add-hours">Hours</Label>
                <Input
                  id="add-hours"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newDeployment.hours}
                  onChange={(e) => setNewDeployment({ ...newDeployment, hours: e.target.value })}
                  placeholder="Hours worked"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add-rate">Hourly Rate (₹)</Label>
              <Input
                id="add-rate"
                type="number"
                min="0.01"
                step="0.01"
                value={newDeployment.hourlyRate}
                onChange={(e) => setNewDeployment({ ...newDeployment, hourlyRate: e.target.value })}
                placeholder="Rate per hour"
                className="mt-1"
              />
              {newDeployment.workers && newDeployment.hours && newDeployment.hourlyRate && (
                <p className="text-sm text-gray-600 mt-1">
                  Total cost: ₹
                  {(
                    Number(newDeployment.workers) *
                    Number(newDeployment.hours) *
                    Number(newDeployment.hourlyRate)
                  ).toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="add-notes">Notes (Optional)</Label>
              <Textarea
                id="add-notes"
                value={newDeployment.notes}
                onChange={(e) => setNewDeployment({ ...newDeployment, notes: e.target.value })}
                placeholder="Additional notes or details"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDeployment}>Add Deployment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deployment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Labor Deployment</DialogTitle>
            <DialogDescription>Update the labor deployment details.</DialogDescription>
          </DialogHeader>
          {editingDeployment && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingDeployment.date.split("/").reverse().join("-")}
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    setEditingDeployment({
                      ...editingDeployment,
                      date: date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }),
                    })
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingDeployment.category}
                  onValueChange={(value) => setEditingDeployment({ ...editingDeployment, category: value })}
                >
                  <SelectTrigger id="edit-category" className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh] overflow-y-auto">
                    {LABOR_CATEGORIES.map((category) => (
                      <SelectItem key={category.code} value={category.code}>
                        {category.code} - {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-workers">Workers</Label>
                  <Input
                    id="edit-workers"
                    type="number"
                    min="1"
                    value={editingDeployment.workers}
                    onChange={(e) => setEditingDeployment({ ...editingDeployment, workers: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hours">Hours</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={editingDeployment.hours}
                    onChange={(e) => setEditingDeployment({ ...editingDeployment, hours: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-rate">Hourly Rate (₹)</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editingDeployment.hourlyRate}
                  onChange={(e) => setEditingDeployment({ ...editingDeployment, hourlyRate: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Total cost: ₹
                  {(editingDeployment.workers * editingDeployment.hours * editingDeployment.hourlyRate).toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={editingDeployment.notes}
                  onChange={(e) => setEditingDeployment({ ...editingDeployment, notes: e.target.value })}
                  placeholder="Additional notes or details"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this labor deployment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDeployment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
