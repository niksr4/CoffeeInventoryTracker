"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Eye, Package, MapPin, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { useTraceabilityData } from "@/hooks/use-traceability-data"
import { generateBatchNumber, formatDate, getStatusColor, validateBatch } from "@/lib/traceability-service"
import type { Batch } from "@/lib/traceability-service"
import { toast } from "@/components/ui/use-toast"

export default function BatchManagement() {
  const { batches, hives, addBatch, updateBatch, getBatchById, getHiveById } = useTraceabilityData()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Form state for creating/editing batches
  const [formData, setFormData] = useState({
    batchNumber: "",
    productType: "",
    sourceHiveId: "",
    harvestDate: "",
    quantityInitial: "",
    unit: "kg",
    qualityGrade: "",
    notes: "",
  })

  // Filter batches based on search and status
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      batchNumber: generateBatchNumber(),
      productType: "",
      sourceHiveId: "",
      harvestDate: "",
      quantityInitial: "",
      unit: "kg",
      qualityGrade: "",
      notes: "",
    })
  }

  // Handle create batch
  const handleCreateBatch = () => {
    const errors = validateBatch({
      ...formData,
      quantityInitial: Number.parseFloat(formData.quantityInitial),
    })

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }

    const newBatch = addBatch({
      batchNumber: formData.batchNumber,
      productType: formData.productType,
      sourceHiveId: formData.sourceHiveId || undefined,
      harvestDate: formData.harvestDate,
      quantityInitial: Number.parseFloat(formData.quantityInitial),
      quantityCurrent: Number.parseFloat(formData.quantityInitial),
      unit: formData.unit,
      status: "active",
      qualityGrade: formData.qualityGrade || undefined,
      notes: formData.notes || undefined,
    })

    toast({
      title: "Batch Created",
      description: `Batch ${newBatch.batchNumber} has been created successfully.`,
    })

    setIsCreateDialogOpen(false)
    resetForm()
  }

  // Handle view batch details
  const handleViewBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setIsViewDialogOpen(true)
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "packaged":
        return <CheckCircle className="h-4 w-4" />
      case "shipped":
        return <MapPin className="h-4 w-4" />
      case "sold":
        return <CheckCircle className="h-4 w-4" />
      case "recalled":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Initialize form with generated batch number
  useState(() => {
    resetForm()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Management</h2>
          <p className="text-muted-foreground">Track and manage honey batches from harvest to delivery</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Create a new batch to track honey from harvest through processing and delivery.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, batchNumber: e.target.value }))}
                    placeholder="Auto-generated"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, productType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wildflower Honey">Wildflower Honey</SelectItem>
                      <SelectItem value="Clover Honey">Clover Honey</SelectItem>
                      <SelectItem value="Orange Blossom Honey">Orange Blossom Honey</SelectItem>
                      <SelectItem value="Acacia Honey">Acacia Honey</SelectItem>
                      <SelectItem value="Manuka Honey">Manuka Honey</SelectItem>
                      <SelectItem value="Raw Honey">Raw Honey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceHive">Source Hive (Optional)</Label>
                  <Select
                    value={formData.sourceHiveId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, sourceHiveId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source hive" />
                    </SelectTrigger>
                    <SelectContent>
                      {hives.map((hive) => (
                        <SelectItem key={hive.id} value={hive.id}>
                          {hive.hiveNumber} - {hive.locationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="harvestDate">Harvest Date</Label>
                  <Input
                    id="harvestDate"
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, harvestDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Initial Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={formData.quantityInitial}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantityInitial: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="L">Liters (L)</SelectItem>
                      <SelectItem value="gal">Gallons (gal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualityGrade">Quality Grade (Optional)</Label>
                  <Select
                    value={formData.qualityGrade}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, qualityGrade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grade A">Grade A</SelectItem>
                      <SelectItem value="Grade B">Grade B</SelectItem>
                      <SelectItem value="Grade C">Grade C</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Organic">Organic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this batch..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBatch}>Create Batch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by batch number or product type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="packaged">Packaged</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="recalled">Recalled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batch Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.filter((b) => ["active", "processing"].includes(b.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">In production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.reduce((sum, b) => sum + b.quantityCurrent, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">kg current stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                batches.filter((b) => {
                  const batchDate = new Date(b.harvestDate)
                  const now = new Date()
                  return batchDate.getMonth() === now.getMonth() && batchDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">New batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      <Card>
        <CardHeader>
          <CardTitle>Batch List</CardTitle>
          <CardDescription>
            {filteredBatches.length} of {batches.length} batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Harvest Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source Hive</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const sourceHive = batch.sourceHiveId ? getHiveById(batch.sourceHiveId) : null
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                    <TableCell>{batch.productType}</TableCell>
                    <TableCell>{formatDate(batch.harvestDate)}</TableCell>
                    <TableCell>
                      {batch.quantityCurrent.toFixed(1)} / {batch.quantityInitial.toFixed(1)} {batch.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(batch.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(batch.status)}
                          {batch.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sourceHive ? `${sourceHive.hiveNumber} - ${sourceHive.locationName}` : "Not specified"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredBatches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No batches found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Batch Details - {selectedBatch?.batchNumber}</DialogTitle>
            <DialogDescription>Complete information and tracking history for this batch</DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product Type</Label>
                  <p className="text-sm font-medium">{selectedBatch.productType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Harvest Date</Label>
                  <p className="text-sm font-medium">{formatDate(selectedBatch.harvestDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Quantity</Label>
                  <p className="text-sm font-medium">
                    {selectedBatch.quantityCurrent} {selectedBatch.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedBatch.status)}>{selectedBatch.status}</Badge>
                </div>
              </div>
              {selectedBatch.qualityGrade && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quality Grade</Label>
                  <p className="text-sm font-medium">{selectedBatch.qualityGrade}</p>
                </div>
              )}
              {selectedBatch.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedBatch.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
