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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Plus, CheckCircle, XCircle, Thermometer, Droplets, Beaker, Eye, Calendar } from "lucide-react"
import { useTraceabilityData } from "@/hooks/use-traceability-data"
import { formatDateTime } from "@/lib/traceability-service"
import { toast } from "@/components/ui/use-toast"

export default function QualityControl() {
  const { batches, qualityCheckpoints, addQualityCheckpoint, getQualityCheckpointsForBatch, getBatchById } =
    useTraceabilityData()

  const [selectedBatchId, setSelectedBatchId] = useState<string>("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [checkpointFilter, setCheckpointFilter] = useState<string>("all")

  // Form state for creating quality checkpoints
  const [formData, setFormData] = useState({
    batchId: "",
    checkpointType: "harvest", // Updated default value
    inspectorName: "",
    inspectionDate: "",
    temperature: "",
    humidity: "",
    phLevel: "",
    moistureContent: "",
    colorGrade: "",
    tasteNotes: "",
    visualInspection: "",
    passed: true,
    issuesFound: "",
    correctiveActions: "",
  })

  // Get filtered checkpoints
  const filteredCheckpoints = qualityCheckpoints.filter((checkpoint) => {
    const matchesBatch = selectedBatchId === "all-batches" || !selectedBatchId || checkpoint.batchId === selectedBatchId
    const matchesType = checkpointFilter === "all" || checkpoint.checkpointType === checkpointFilter
    return matchesBatch && matchesType
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      batchId: "",
      checkpointType: "harvest", // Updated default value
      inspectorName: "",
      inspectionDate: new Date().toISOString().slice(0, 16),
      temperature: "",
      humidity: "",
      phLevel: "",
      moistureContent: "",
      colorGrade: "",
      tasteNotes: "",
      visualInspection: "",
      passed: true,
      issuesFound: "",
      correctiveActions: "",
    })
  }

  // Handle create checkpoint
  const handleCreateCheckpoint = () => {
    if (!formData.batchId || !formData.checkpointType || !formData.inspectorName) {
      toast({
        title: "Validation Error",
        description: "Batch, checkpoint type, and inspector name are required.",
        variant: "destructive",
      })
      return
    }

    const newCheckpoint = addQualityCheckpoint({
      batchId: formData.batchId,
      checkpointType: formData.checkpointType as any,
      inspectorName: formData.inspectorName,
      inspectionDate: formData.inspectionDate,
      temperature: formData.temperature ? Number.parseFloat(formData.temperature) : undefined,
      humidity: formData.humidity ? Number.parseFloat(formData.humidity) : undefined,
      phLevel: formData.phLevel ? Number.parseFloat(formData.phLevel) : undefined,
      moistureContent: formData.moistureContent ? Number.parseFloat(formData.moistureContent) : undefined,
      colorGrade: formData.colorGrade || undefined,
      tasteNotes: formData.tasteNotes || undefined,
      visualInspection: formData.visualInspection || undefined,
      passed: formData.passed,
      issuesFound: formData.issuesFound || undefined,
      correctiveActions: formData.correctiveActions || undefined,
    })

    const batch = getBatchById(formData.batchId)
    toast({
      title: "Quality Checkpoint Created",
      description: `${formData.checkpointType} checkpoint added for batch ${batch?.batchNumber}.`,
    })

    setIsCreateDialogOpen(false)
    resetForm()
  }

  // Get checkpoint type icon
  const getCheckpointIcon = (type: string) => {
    switch (type) {
      case "harvest":
        return <Calendar className="h-4 w-4" />
      case "extraction":
        return <Droplets className="h-4 w-4" />
      case "filtering":
        return <Beaker className="h-4 w-4" />
      case "packaging":
        return <Plus className="h-4 w-4" />
      case "storage":
        return <Thermometer className="h-4 w-4" />
      case "shipping":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  // Get pass/fail badge
  const getPassFailBadge = (passed: boolean) => {
    return (
      <Badge className={passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        <div className="flex items-center gap-1">
          {passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {passed ? "Passed" : "Failed"}
        </div>
      </Badge>
    )
  }

  // Calculate checkpoint statistics
  const stats = {
    total: qualityCheckpoints.length,
    passed: qualityCheckpoints.filter((qc) => qc.passed).length,
    failed: qualityCheckpoints.filter((qc) => !qc.passed).length,
    thisWeek: qualityCheckpoints.filter((qc) => {
      const checkpointDate = new Date(qc.inspectionDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return checkpointDate >= weekAgo
    }).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quality Control</h2>
          <p className="text-muted-foreground">
            Monitor and record quality checkpoints throughout the production process
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Quality Checkpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add Quality Checkpoint</DialogTitle>
              <DialogDescription>Record quality control measurements and observations for a batch.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Select
                    value={formData.batchId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, batchId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber} - {batch.productType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkpointType">Checkpoint Type</Label>
                  <Select
                    value={formData.checkpointType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, checkpointType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select checkpoint type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harvest">Harvest</SelectItem>
                      <SelectItem value="extraction">Extraction</SelectItem>
                      <SelectItem value="filtering">Filtering</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="shipping">Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inspector">Inspector Name</Label>
                  <Input
                    id="inspector"
                    value={formData.inspectorName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inspectorName: e.target.value }))}
                    placeholder="Enter inspector name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspectionDate">Inspection Date & Time</Label>
                  <Input
                    id="inspectionDate"
                    type="datetime-local"
                    value={formData.inspectionDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                  />
                </div>
              </div>

              <Tabs defaultValue="measurements" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="measurements">Measurements</TabsTrigger>
                  <TabsTrigger value="observations">Observations</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="measurements" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData((prev) => ({ ...prev, temperature: e.target.value }))}
                        placeholder="e.g., 22.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Humidity (%)</Label>
                      <Input
                        id="humidity"
                        type="number"
                        step="0.1"
                        value={formData.humidity}
                        onChange={(e) => setFormData((prev) => ({ ...prev, humidity: e.target.value }))}
                        placeholder="e.g., 65.0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phLevel">pH Level</Label>
                      <Input
                        id="phLevel"
                        type="number"
                        step="0.01"
                        value={formData.phLevel}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phLevel: e.target.value }))}
                        placeholder="e.g., 3.9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moistureContent">Moisture Content (%)</Label>
                      <Input
                        id="moistureContent"
                        type="number"
                        step="0.1"
                        value={formData.moistureContent}
                        onChange={(e) => setFormData((prev) => ({ ...prev, moistureContent: e.target.value }))}
                        placeholder="e.g., 18.2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="observations" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="colorGrade">Color Grade</Label>
                    <Select
                      value={formData.colorGrade}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, colorGrade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Water White">Water White</SelectItem>
                        <SelectItem value="Extra White">Extra White</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Extra Light Amber">Extra Light Amber</SelectItem>
                        <SelectItem value="Light Amber">Light Amber</SelectItem>
                        <SelectItem value="Amber">Amber</SelectItem>
                        <SelectItem value="Dark Amber">Dark Amber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tasteNotes">Taste Notes</Label>
                    <Textarea
                      id="tasteNotes"
                      value={formData.tasteNotes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tasteNotes: e.target.value }))}
                      placeholder="Describe flavor profile, sweetness, aftertaste..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visualInspection">Visual Inspection</Label>
                    <Textarea
                      id="visualInspection"
                      value={formData.visualInspection}
                      onChange={(e) => setFormData((prev) => ({ ...prev, visualInspection: e.target.value }))}
                      placeholder="Describe clarity, crystallization, foreign matter..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="passed"
                      checked={formData.passed}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, passed: checked }))}
                    />
                    <Label htmlFor="passed">Checkpoint Passed</Label>
                  </div>
                  {!formData.passed && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="issuesFound">Issues Found</Label>
                        <Textarea
                          id="issuesFound"
                          value={formData.issuesFound}
                          onChange={(e) => setFormData((prev) => ({ ...prev, issuesFound: e.target.value }))}
                          placeholder="Describe any issues or non-conformances found..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correctiveActions">Corrective Actions</Label>
                        <Textarea
                          id="correctiveActions"
                          value={formData.correctiveActions}
                          onChange={(e) => setFormData((prev) => ({ ...prev, correctiveActions: e.target.value }))}
                          placeholder="Describe corrective actions taken or required..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCheckpoint}>Add Checkpoint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quality Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checkpoints</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}% pass rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">{stats.failed > 0 ? "Requires attention" : "No failures"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-batches">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batchNumber} - {batch.productType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={checkpointFilter} onValueChange={setCheckpointFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by checkpoint type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Checkpoints</SelectItem>
                <SelectItem value="harvest">Harvest</SelectItem>
                <SelectItem value="extraction">Extraction</SelectItem>
                <SelectItem value="filtering">Filtering</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quality Checkpoints List */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Checkpoints</CardTitle>
          <CardDescription>{filteredCheckpoints.length} checkpoints found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Checkpoint Type</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Moisture</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheckpoints.map((checkpoint) => {
                const batch = getBatchById(checkpoint.batchId)
                return (
                  <TableRow key={checkpoint.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{batch?.batchNumber}</div>
                        <div className="text-sm text-muted-foreground">{batch?.productType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCheckpointIcon(checkpoint.checkpointType)}
                        <span className="capitalize">{checkpoint.checkpointType}</span>
                      </div>
                    </TableCell>
                    <TableCell>{checkpoint.inspectorName}</TableCell>
                    <TableCell>{formatDateTime(checkpoint.inspectionDate)}</TableCell>
                    <TableCell>{checkpoint.temperature ? `${checkpoint.temperature}°C` : "-"}</TableCell>
                    <TableCell>{checkpoint.moistureContent ? `${checkpoint.moistureContent}%` : "-"}</TableCell>
                    <TableCell>{getPassFailBadge(checkpoint.passed)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredCheckpoints.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quality checkpoints found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
