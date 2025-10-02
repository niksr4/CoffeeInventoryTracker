"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useLaborData } from "@/hooks/use-labor-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Edit2, Save, X, ChevronDown, ChevronUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ActivityCode {
  code: string
  reference: string
}

export default function LaborDeploymentTab() {
  const { deployments, loading, addDeployment, updateDeployment, deleteDeployment } = useLaborData()

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [activities, setActivities] = useState<ActivityCode[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Form state - Changed outsideCostPerLaborer default from 0 to 450
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    code: "",
    reference: "",
    hfLaborers: 0,
    hfCostPerLaborer: 475,
    outsideLaborers: 0,
    outsideCostPerLaborer: 450,
    notes: "",
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/get-activity")
      const data = await response.json()
      if (data.success && data.activities) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  // Autofill reference when code changes
  const handleCodeChange = (code: string) => {
    setFormData((prev) => ({ ...prev, code }))

    // Find matching activity and autofill reference
    const matchingActivity = activities.find((activity) => activity.code.toLowerCase() === code.toLowerCase())

    if (matchingActivity) {
      setFormData((prev) => ({ ...prev, reference: matchingActivity.reference }))
    }
  }

  const calculateTotal = () => {
    const hfTotal = formData.hfLaborers * formData.hfCostPerLaborer
    const outsideTotal = formData.outsideLaborers * formData.outsideCostPerLaborer
    return hfTotal + outsideTotal
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      code: "",
      reference: "",
      hfLaborers: 0,
      hfCostPerLaborer: 475,
      outsideLaborers: 0,
      outsideCostPerLaborer: 450,
      notes: "",
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const laborEntries = [
      {
        name: "HoneyFarm",
        laborCount: formData.hfLaborers,
        costPerLabor: formData.hfCostPerLaborer,
      },
    ]

    if (formData.outsideLaborers > 0) {
      laborEntries.push({
        name: "Outside Labor",
        laborCount: formData.outsideLaborers,
        costPerLabor: formData.outsideCostPerLaborer,
      })
    }

    const deployment = {
      date: formData.date,
      code: formData.code,
      reference: formData.reference,
      laborEntries,
      totalCost: calculateTotal(),
      notes: formData.notes,
      user: "admin",
    }

    if (editingId) {
      await updateDeployment(editingId, deployment)
    } else {
      await addDeployment(deployment)
    }

    resetForm()
  }

  const startEdit = (deployment: any) => {
    const hfEntry = deployment.laborEntries[0]
    const outsideEntry = deployment.laborEntries[1]

    setFormData({
      date: deployment.date.split("T")[0],
      code: deployment.code,
      reference: deployment.reference,
      hfLaborers: hfEntry?.laborCount || 0,
      hfCostPerLaborer: hfEntry?.costPerLabor || 475,
      outsideLaborers: outsideEntry?.laborCount || 0,
      outsideCostPerLaborer: outsideEntry?.costPerLabor || 450,
      notes: deployment.notes || "",
    })
    setEditingId(deployment.id)
    setIsAdding(true)
  }

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const totalDeploymentCost = deployments.reduce((sum, d) => sum + d.totalCost, 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Labor Deployments</CardTitle>
              <CardDescription className="text-sm">Track HoneyFarm and outside labor</CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-muted-foreground">Total Labor Cost</p>
              <p className="text-xl sm:text-2xl font-bold">
                ₹{totalDeploymentCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)} className="w-full h-12 text-base">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Labor Deployment
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-3 sm:p-4 bg-muted/50">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-base">
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Enter activity code"
                    required
                    list="activity-codes"
                    className="h-11"
                  />
                  <datalist id="activity-codes">
                    {activities.map((activity) => (
                      <option key={activity.code} value={activity.code}>
                        {activity.reference}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference" className="text-base">
                    Reference
                  </Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))}
                    placeholder="Auto-filled from code"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-base">HoneyFarm Labor</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hfLaborers" className="text-base">
                      Number of Laborers
                    </Label>
                    <Input
                      id="hfLaborers"
                      type="number"
                      min="0"
                      value={formData.hfLaborers}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hfLaborers: Number.parseInt(e.target.value) || 0 }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hfCostPerLaborer" className="text-base">
                      Cost per Laborer (₹)
                    </Label>
                    <Input
                      id="hfCostPerLaborer"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hfCostPerLaborer}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hfCostPerLaborer: Number.parseFloat(e.target.value) || 0 }))
                      }
                      className="h-11"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Subtotal: ₹
                  {(formData.hfLaborers * formData.hfCostPerLaborer).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-base">Outside Labor</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="outsideLaborers" className="text-base">
                      Number of Laborers
                    </Label>
                    <Input
                      id="outsideLaborers"
                      type="number"
                      min="0"
                      value={formData.outsideLaborers}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, outsideLaborers: Number.parseInt(e.target.value) || 0 }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outsideCostPerLaborer" className="text-base">
                      Cost per Laborer (₹)
                    </Label>
                    <Input
                      id="outsideCostPerLaborer"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outsideCostPerLaborer}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          outsideCostPerLaborer: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Subtotal: ₹
                  {(formData.outsideLaborers * formData.outsideCostPerLaborer).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  className="text-base"
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-lg font-semibold">
                  Total Cost: ₹
                  {calculateTotal().toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="flex-1 h-12 text-base">
                  <Save className="mr-2 h-5 w-5" />
                  {editingId ? "Update" : "Save"} Deployment
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="h-12 text-base bg-transparent">
                  <X className="mr-2 h-5 w-5" /> Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading labor deployments...</div>
      ) : deployments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Deployment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="block sm:hidden">
              {deployments.map((deployment) => {
                const hfEntry = deployment.laborEntries[0]
                const outsideEntry = deployment.laborEntries[1]
                const isExpanded = expandedRows.has(deployment.id)

                return (
                  <Collapsible key={deployment.id} open={isExpanded} onOpenChange={() => toggleRow(deployment.id)}>
                    <div className="border-b p-4">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex justify-between items-start">
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-xs">
                                {deployment.code}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{formatDate(deployment.date)}</span>
                            </div>
                            <p className="font-medium text-sm line-clamp-1">{deployment.reference}</p>
                            <p className="text-lg font-bold text-green-700 mt-1">
                              ₹
                              {deployment.totalCost.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pt-3 space-y-2">
                        {hfEntry && hfEntry.laborCount > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">HF Labor:</span> {hfEntry.laborCount} @ ₹
                            {hfEntry.costPerLabor.toFixed(2)}
                          </div>
                        )}
                        {outsideEntry && outsideEntry.laborCount > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Outside Labor:</span> {outsideEntry.laborCount} @ ₹
                            {outsideEntry.costPerLabor.toFixed(2)}
                          </div>
                        )}
                        {deployment.notes && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Notes:</span> {deployment.notes}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(deployment)} className="flex-1">
                            <Edit2 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this deployment?")) {
                                deleteDeployment(deployment.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>HF Laborers</TableHead>
                    <TableHead>Outside Laborers</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => {
                    const hfEntry = deployment.laborEntries[0]
                    const outsideEntry = deployment.laborEntries[1]
                    return (
                      <TableRow key={deployment.id}>
                        <TableCell>{formatDate(deployment.date)}</TableCell>
                        <TableCell className="font-medium">{deployment.code}</TableCell>
                        <TableCell>{deployment.reference}</TableCell>
                        <TableCell>
                          {hfEntry ? `${hfEntry.laborCount} @ ₹${hfEntry.costPerLabor.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          {outsideEntry ? `${outsideEntry.laborCount} @ ₹${outsideEntry.costPerLabor.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹
                          {deployment.totalCost.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(deployment)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this deployment?")) {
                                  deleteDeployment(deployment.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No labor deployments recorded yet. Click "Add Labor Deployment" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
