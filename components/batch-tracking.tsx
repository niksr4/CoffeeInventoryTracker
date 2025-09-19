"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, MapPin, Calendar, Package, CheckCircle, Clock, AlertTriangle, Eye, QrCode } from "lucide-react"
import { useTraceabilityData } from "@/hooks/use-traceability-data"
import { formatDate, formatDateTime, getStatusColor } from "@/lib/traceability-service"
import type { Batch } from "@/lib/traceability-service"

export default function BatchTracking() {
  const { batches, hives, qualityCheckpoints, getBatchById, getHiveById, getQualityCheckpointsForBatch } =
    useTraceabilityData()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false)

  // Filter batches based on search
  const filteredBatches = batches.filter(
    (batch) =>
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle batch tracking
  const handleTrackBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setIsTrackingDialogOpen(true)
  }

  // Get tracking timeline for a batch
  const getTrackingTimeline = (batch: Batch) => {
    const timeline = []
    const checkpoints = getQualityCheckpointsForBatch(batch.id)
    const sourceHive = batch.sourceHiveId ? getHiveById(batch.sourceHiveId) : null

    // Harvest event
    timeline.push({
      id: "harvest",
      type: "harvest",
      title: "Harvest",
      description: sourceHive ? `Harvested from ${sourceHive.hiveNumber} - ${sourceHive.locationName}` : "Harvested",
      date: batch.harvestDate,
      status: "completed",
      icon: <Calendar className="h-4 w-4" />,
      details: {
        quantity: `${batch.quantityInitial} ${batch.unit}`,
        location: sourceHive?.locationName,
        hive: sourceHive?.hiveNumber,
      },
    })

    // Quality checkpoints
    checkpoints.forEach((checkpoint) => {
      timeline.push({
        id: checkpoint.id,
        type: "quality",
        title: `${checkpoint.checkpointType.charAt(0).toUpperCase() + checkpoint.checkpointType.slice(1)} Quality Check`,
        description: `Inspected by ${checkpoint.inspectorName}`,
        date: checkpoint.inspectionDate,
        status: checkpoint.passed ? "completed" : "failed",
        icon: checkpoint.passed ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />,
        details: {
          inspector: checkpoint.inspectorName,
          temperature: checkpoint.temperature ? `${checkpoint.temperature}°C` : undefined,
          moisture: checkpoint.moistureContent ? `${checkpoint.moistureContent}%` : undefined,
          result: checkpoint.passed ? "Passed" : "Failed",
          issues: checkpoint.issuesFound,
        },
      })
    })

    // Current status event
    if (batch.status !== "active") {
      timeline.push({
        id: "current-status",
        type: "status",
        title: `${batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}`,
        description: `Batch is currently ${batch.status}`,
        date: batch.updatedAt,
        status: "current",
        icon: <Package className="h-4 w-4" />,
        details: {
          currentQuantity: `${batch.quantityCurrent} ${batch.unit}`,
          status: batch.status,
        },
      })
    }

    // Sort by date
    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "current":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Tracking</h2>
          <p className="text-muted-foreground">Track batches from harvest to delivery with complete traceability</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by batch number or product type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Batch Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.map((batch) => {
          const sourceHive = batch.sourceHiveId ? getHiveById(batch.sourceHiveId) : null
          const checkpoints = getQualityCheckpointsForBatch(batch.id)
          const passedCheckpoints = checkpoints.filter((qc) => qc.passed).length

          return (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{batch.batchNumber}</CardTitle>
                  <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
                </div>
                <CardDescription>{batch.productType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Harvested
                    </div>
                    <div className="font-medium">{formatDate(batch.harvestDate)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-3 w-3" />
                      Quantity
                    </div>
                    <div className="font-medium">
                      {batch.quantityCurrent} {batch.unit}
                    </div>
                  </div>
                </div>

                {sourceHive && (
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Source
                    </div>
                    <div className="font-medium">
                      {sourceHive.hiveNumber} - {sourceHive.locationName}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>
                      {passedCheckpoints}/{checkpoints.length} Quality Checks
                    </span>
                  </div>
                  {batch.qualityGrade && (
                    <Badge variant="outline" className="text-xs">
                      {batch.qualityGrade}
                    </Badge>
                  )}
                </div>

                <Button variant="outline" className="w-full bg-transparent" onClick={() => handleTrackBatch(batch)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Track Batch
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredBatches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No batches found matching your search</p>
          </CardContent>
        </Card>
      )}

      {/* Batch Tracking Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Batch Tracking - {selectedBatch?.batchNumber}
            </DialogTitle>
            <DialogDescription>Complete traceability from harvest to current status</DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-6">
              {/* Batch Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Product Type</div>
                      <div className="font-medium">{selectedBatch.productType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Harvest Date</div>
                      <div className="font-medium">{formatDate(selectedBatch.harvestDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Quantity</div>
                      <div className="font-medium">
                        {selectedBatch.quantityCurrent} {selectedBatch.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge className={getStatusColor(selectedBatch.status)}>{selectedBatch.status}</Badge>
                    </div>
                  </div>
                  {selectedBatch.notes && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <div className="text-sm">{selectedBatch.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tracking Timeline</CardTitle>
                  <CardDescription>Complete journey from harvest to current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getTrackingTimeline(selectedBatch).map((event, index, array) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`p-2 rounded-full border-2 ${
                              event.status === "completed"
                                ? "bg-green-100 border-green-200"
                                : event.status === "failed"
                                  ? "bg-red-100 border-red-200"
                                  : event.status === "current"
                                    ? "bg-blue-100 border-blue-200"
                                    : "bg-gray-100 border-gray-200"
                            }`}
                          >
                            {getStatusIcon(event.status)}
                          </div>
                          {index < array.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-2" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{event.title}</h4>
                            <span className="text-sm text-muted-foreground">{formatDateTime(event.date)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>

                          {/* Event Details */}
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {Object.entries(event.details).map(
                              ([key, value]) =>
                                value && (
                                  <div key={key}>
                                    <span className="text-muted-foreground capitalize">
                                      {key.replace(/([A-Z])/g, " $1")}:{" "}
                                    </span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ),
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Source Information */}
              {selectedBatch.sourceHiveId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Source Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const sourceHive = getHiveById(selectedBatch.sourceHiveId!)
                      return sourceHive ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Hive Number</div>
                            <div className="font-medium">{sourceHive.hiveNumber}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Location</div>
                            <div className="font-medium">{sourceHive.locationName}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Health Status</div>
                            <Badge className={getStatusColor(sourceHive.healthStatus)}>{sourceHive.healthStatus}</Badge>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Queen Age</div>
                            <div className="font-medium">
                              {sourceHive.queenAgeMonths ? `${sourceHive.queenAgeMonths} months` : "Unknown"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Source hive information not available</p>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
