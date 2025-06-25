"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLaborData, type LaborEntry, type LaborDeployment } from "@/hooks/use-labor-data"
import { useConsumablesData, type ConsumableDeployment } from "@/hooks/use-consumables-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Check,
  Search,
  Users,
  PlusCircle,
  XCircle,
  MessageSquare,
  Edit,
  Trash2,
  CalendarDays,
  ClipboardList,
  Droplets,
  FileText,
  Coins,
} from "lucide-react"

// Shared code map for both labor and consumables
const expenditureCodeMap: { [key: string]: string } = {
  "101": "Salaries And Allowances",
  "102": "Provident Fund, Insurance",
  "103": "Bonus Staff And Labour",
  "104": "Gratuity",
  "105": "Bungalow Servants",
  "106": "Leave With Wages",
  "107": "Sickness Benifit",
  "108": "Medical Exp Staff, Labour",
  "109": "Labour Welfare",
  "110": "Postage, Stationary",
  "111": "Watchman Estate, Drying Yard",
  "112": "Vehicle Running -Tractor",
  "113": "Electricity",
  "115": "Machinary Maintenance",
  "116": "Land Tax",
  "117": "Maint Build, Roads, Yard",
  "118": "Weather Protectives",
  "119": "Cattle Expenses",
  "120": "Water Supply",
  "121": "Telephone Bill",
  "122": "Miscellaneous",
  "123": "Tools And Implements",
  "131": "Arabica Weeding, Trenching",
  "132": "Arabica Pruning, Handling",
  "133": "Arabica Borer Tracing",
  "134": "Arabica Shade Work",
  "135": "Arabica, Cost Lime, Manure",
  "136": "Arabica Manuring",
  "137": "Arabica Spraying",
  "138": "Arabica Fence",
  "139": "Arabica Supplies, Upkeep",
  "140": "Arabica Harvesting",
  "141": "Vehicle Running & Maint",
  "143": "Arabica Irrigation",
  "150": "Drip line Maintenance",
  "151": "Robusta Weeding",
  "152": "Robusta Pruning, Handling",
  "153": "Pest Control, Berry Borer,",
  "154": "Robusta Shade Temp, Perm.",
  "155": "Robusta, Cost Lime, Manure",
  "156": "Robusta Liming, Manuring",
  "157": "Robusta Spray",
  "158": "Robusta Fence Maint",
  "159": "Supplies Planting, Upkeep",
  "160": "Robust Harvesting",
  "161": "Robusta Processing & Drying",
  "162": "Robusta Curing",
  "163": "Robusta Irrigation",
  "181": "Pepper planting, upkeep",
  "182": "Pepper Manuring",
  "183": "Pepper Pest & Disease Cont.",
  "184": "Pepper Havest, Process, Pack",
  "185": "Compost Preperation",
  "191": "Paddy Cultivation",
  "200": "arecanut composting",
  "201": "Arecanut",
  "202": "- Orange",
  "204": "Ginger",
  "206": "Other Crops",
  "210": "Nursery",
  "211": "New Clearing",
  "212": "Planting Temporary Shade",
  "213": "Lining",
  "214": "Pitting",
  "215": "New Planting, Clearing",
  "216": "Mulching & Staking",
  "217": "Cover Digging",
  "218": "Sheltering",
  "219": "Lime",
  "220": "Weeding - (New Clearing)",
  "221": "Pests & Diseses",
  "222": "Fence (New Clearing)",
  "232": "Lent",
  "233": "Capital Account",
  "245": "Organic Compost Manure",
}

const formatDate = (dateString?: string, style: "short" | "long" | "date-only" | "qif" = "short") => {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    let options: Intl.DateTimeFormatOptions = {}
    if (style === "short") {
      options = { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }
    } else if (style === "long") {
      options = { dateStyle: "medium", timeStyle: "short" }
    } else if (style === "date-only") {
      options = { day: "2-digit", month: "2-digit", year: "numeric" }
    } else if (style === "qif") {
      // QIF format: MM/DD/YYYY or MM/DD'YY. Using YYYY for clarity.
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      return `${month}/${day}/${year}`
    }
    return new Intl.DateTimeFormat("en-GB", options).format(date)
  } catch (error) {
    return dateString
  }
}

type FormLaborEntry = { laborCount: string; costPerLabor: string }

const CURRENT_YEAR = new Date().getFullYear()
const IS_PRESET_YEAR = CURRENT_YEAR === 2025

const getInitialCostForLaborGroup = (index: number): string => {
  if (IS_PRESET_YEAR) {
    if (index === 0) return "475" // HF Labour
    return "450" // Outside Labour
  }
  return "0"
}

const initialLaborEntry = (): FormLaborEntry => ({ laborCount: "", costPerLabor: getInitialCostForLaborGroup(0) })

// --- Labor Deployment Component ---
const LaborSection = () => {
  const { user, isAdmin } = useAuth()
  const {
    deployments: laborDeployments,
    loading: laborLoading,
    addDeployment: addLaborDeployment,
    updateDeployment: updateLaborDeployment,
    deleteDeployment: deleteLaborDeployment,
  } = useLaborData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditDeployment, setCurrentEditDeployment] = useState<LaborDeployment | null>(null)

  const [deploymentDate, setDeploymentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [code, setCode] = useState("")
  const [reference, setReference] = useState("")
  const [laborEntries, setLaborEntries] = useState<FormLaborEntry[]>([initialLaborEntry()])
  const [notes, setNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const resetForm = () => {
    setDeploymentDate(new Date().toISOString().split("T")[0])
    setCode("")
    setReference("")
    setLaborEntries([initialLaborEntry()])
    setNotes("")
    setIsEditing(false)
    setCurrentEditDeployment(null)
  }

  useEffect(() => {
    if (currentEditDeployment) {
      setIsEditing(true)
      setDeploymentDate(new Date(currentEditDeployment.date).toISOString().split("T")[0])
      setCode(currentEditDeployment.code)
      setReference(currentEditDeployment.reference)
      setLaborEntries(
        currentEditDeployment.laborEntries.map((le) => ({
          laborCount: String(le.laborCount),
          costPerLabor: String(le.costPerLabor),
        })),
      )
      setNotes(currentEditDeployment.notes || "")
    } else {
      resetForm()
    }
  }, [currentEditDeployment])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setReference(expenditureCodeMap[newCode] || "")
  }

  const handleLaborEntryChange = (index: number, field: keyof FormLaborEntry, value: string) => {
    const updatedEntries = [...laborEntries]
    updatedEntries[index][field] = value
    setLaborEntries(updatedEntries)
  }
  const addLaborEntryField = () => {
    const newIndex = laborEntries.length
    setLaborEntries([...laborEntries, { laborCount: "", costPerLabor: getInitialCostForLaborGroup(newIndex) }])
  }
  const removeLaborEntryField = (index: number) => {
    if (laborEntries.length > 1) {
      const updatedEntries = laborEntries.filter((_, i) => i !== index)
      setLaborEntries(updatedEntries)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !reference || !user || !deploymentDate || laborEntries.length === 0) {
      alert("Please fill in Date, Code, Reference, and at least one Labor Group.")
      return
    }
    if (laborEntries.some((entry) => !entry.laborCount || Number(entry.laborCount) <= 0)) {
      alert("Please ensure all labor groups have a valid number of laborers.")
      return
    }

    setIsSubmitting(true)
    const numericLaborEntries: LaborEntry[] = laborEntries
      .map((entry) => ({
        laborCount: Number(entry.laborCount),
        costPerLabor: Number(entry.costPerLabor || "0"),
      }))
      .filter((entry) => entry.laborCount > 0)

    const payload = {
      code,
      reference,
      laborEntries: numericLaborEntries,
      user: user.username,
      date: deploymentDate,
      notes,
    }
    let success = false
    if (isEditing && currentEditDeployment) {
      success = await updateLaborDeployment(currentEditDeployment.id, payload)
    } else {
      success = await addLaborDeployment(payload)
    }
    if (success) resetForm()
    setIsSubmitting(false)
  }

  const totalCost = useMemo(() => {
    return laborEntries
      .reduce((sum, entry) => {
        const laborCount = Number(entry.laborCount)
        const costPerLabor = Number(entry.costPerLabor || "0")
        return sum + (isNaN(laborCount) || isNaN(costPerLabor) ? 0 : laborCount * costPerLabor)
      }, 0)
      .toFixed(2)
  }, [laborEntries])

  const filteredDeployments = useMemo(() => {
    let deploymentsToFilter = laborDeployments
    if (!isAdmin && user) deploymentsToFilter = laborDeployments.filter((d) => d.user === user.username)
    if (!searchTerm) return deploymentsToFilter
    const lowercasedFilter = searchTerm.toLowerCase()
    return deploymentsToFilter.filter(
      (d) =>
        d.code.toLowerCase().includes(lowercasedFilter) ||
        d.reference.toLowerCase().includes(lowercasedFilter) ||
        d.user.toLowerCase().includes(lowercasedFilter) ||
        (d.notes && d.notes.toLowerCase().includes(lowercasedFilter)),
    )
  }, [laborDeployments, searchTerm, isAdmin, user])

  const handleEdit = (deployment: LaborDeployment) => setCurrentEditDeployment(deployment)
  const handleDelete = async (deploymentId: string) => {
    setIsSubmitting(true)
    const success = await deleteLaborDeployment(deploymentId)
    if (success && currentEditDeployment?.id === deploymentId) resetForm()
    setIsSubmitting(false)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Labor Deployment" : "Record Labor Deployment"}</CardTitle>
          <CardDescription>{isEditing ? "Modify the details." : "Enter details for labor deployed."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="laborDeploymentDate">Deployment Date</Label>
              <Input
                id="laborDeploymentDate"
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                required
                className="w-full sm:w-1/2"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laborCode">Code</Label>
                <Input id="laborCode" value={code} onChange={handleCodeChange} placeholder="e.g., 101" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laborReference">Reference</Label>
                <Input id="laborReference" value={reference} readOnly placeholder="Auto-filled from code" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Labor Groups</h3>
              {laborEntries.map((entry, index) => (
                <div key={`labor-${index}`} className="space-y-3 p-3 border rounded-md relative">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-600">
                      {index === 0 ? "HF Labour" : `Outside Labour ${index}`}
                    </p>
                    {laborEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => removeLaborEntryField(index)}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`laborCount-${index}`}>Number of Laborers</Label>
                      <Input
                        id={`laborCount-${index}`}
                        type="number"
                        value={entry.laborCount}
                        onChange={(e) => handleLaborEntryChange(index, "laborCount", e.target.value)}
                        placeholder="e.g., 10"
                        required
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`costPerLabor-${index}`}>Cost per Laborer (₹)</Label>
                      <Input
                        id={`costPerLabor-${index}`}
                        type="number"
                        value={entry.costPerLabor}
                        onChange={(e) => handleLaborEntryChange(index, "costPerLabor", e.target.value)}
                        placeholder={`e.g., ${getInitialCostForLaborGroup(index)}`}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLaborEntryField} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Outside Labour Group
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="laborNotes">Notes (Optional)</Label>
              <Textarea
                id="laborNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant notes..."
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-gray-600">Total Estimated Cost</p>
              <p className="text-2xl font-bold text-green-700">₹{totalCost}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-grow bg-green-700 hover:bg-green-800"
                disabled={isSubmitting || laborLoading}
              >
                <Check className="mr-2 h-4 w-4" />{" "}
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Submitting..."
                  : isEditing
                    ? "Update Deployment"
                    : "Submit Deployment"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Labor History</CardTitle>
          <CardDescription>{isAdmin ? "All labor deployments." : "Your labor deployments."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search labor history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
            {laborLoading && laborDeployments.length === 0 ? (
              <p className="text-center py-4">Loading history...</p>
            ) : filteredDeployments.length > 0 ? (
              filteredDeployments.map((d) => (
                <div key={d.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {d.code} - {d.reference}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        {formatDate(d.date, "long")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-700">₹{d.totalCost.toFixed(2)}</p>
                      {(isAdmin || user?.username === "KAB123") && (
                        <div className="flex gap-1 mt-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600"
                            onClick={() => handleEdit(d)}
                            disabled={isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this labor entry.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(d.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 ml-2">
                    {d.laborEntries.map((entry, idx) => (
                      <span key={idx} className="block">
                        {idx === 0 ? "HF: " : `Outside ${idx}: `}
                        {entry.laborCount} laborers @ ₹{entry.costPerLabor.toFixed(2)}
                      </span>
                    ))}
                  </div>
                  {d.notes && (
                    <div className="mt-2 pt-2 border-t text-sm text-gray-600 flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5" />
                      <p className="whitespace-pre-wrap">{d.notes}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className={`mt-2 ${d.notes ? "pt-2 border-t" : ""}`}>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1.5" />
                        Recorded by: {d.user}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No labor deployments found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Consumables Component ---
const ConsumablesSection = () => {
  const { user, isAdmin } = useAuth()
  const {
    deployments: consumableDeployments,
    loading: consumablesLoading,
    addDeployment: addConsumableDeployment,
    updateDeployment: updateConsumableDeployment,
    deleteDeployment: deleteConsumableDeployment,
  } = useConsumablesData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditDeployment, setCurrentEditDeployment] = useState<ConsumableDeployment | null>(null)

  const [deploymentDate, setDeploymentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [code, setCode] = useState("")
  const [reference, setReference] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const resetForm = () => {
    setDeploymentDate(new Date().toISOString().split("T")[0])
    setCode("")
    setReference("")
    setAmount("")
    setNotes("")
    setIsEditing(false)
    setCurrentEditDeployment(null)
  }

  useEffect(() => {
    if (currentEditDeployment) {
      setIsEditing(true)
      setDeploymentDate(new Date(currentEditDeployment.date).toISOString().split("T")[0])
      setCode(currentEditDeployment.code)
      setReference(currentEditDeployment.reference)
      setAmount(String(currentEditDeployment.amount))
      setNotes(currentEditDeployment.notes || "")
    } else {
      resetForm()
    }
  }, [currentEditDeployment])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setReference(expenditureCodeMap[newCode] || "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !reference || !user || !deploymentDate || !amount || Number(amount) <= 0) {
      alert("Please fill in Date, Code, Reference, and a valid Amount.")
      return
    }

    setIsSubmitting(true)
    const payload = { date: deploymentDate, code, reference, amount: Number(amount), notes, user: user.username }
    let success = false
    if (isEditing && currentEditDeployment) {
      success = await updateConsumableDeployment(currentEditDeployment.id, payload)
    } else {
      success = await addConsumableDeployment(payload)
    }
    if (success) resetForm()
    setIsSubmitting(false)
  }

  const filteredDeployments = useMemo(() => {
    let deploymentsToFilter = consumableDeployments
    if (!isAdmin && user) deploymentsToFilter = consumableDeployments.filter((d) => d.user === user.username)
    if (!searchTerm) return deploymentsToFilter
    const lowercasedFilter = searchTerm.toLowerCase()
    return deploymentsToFilter.filter(
      (d) =>
        d.code.toLowerCase().includes(lowercasedFilter) ||
        d.reference.toLowerCase().includes(lowercasedFilter) ||
        d.user.toLowerCase().includes(lowercasedFilter) ||
        (d.notes && d.notes.toLowerCase().includes(lowercasedFilter)),
    )
  }, [consumableDeployments, searchTerm, isAdmin, user])

  const handleEdit = (deployment: ConsumableDeployment) => setCurrentEditDeployment(deployment)
  const handleDelete = async (deploymentId: string) => {
    setIsSubmitting(true)
    const success = await deleteConsumableDeployment(deploymentId)
    if (success && currentEditDeployment?.id === deploymentId) resetForm()
    setIsSubmitting(false)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Consumable Entry" : "Record Consumable Entry"}</CardTitle>
          <CardDescription>
            {isEditing ? "Modify the details." : "Enter details for consumables or other expenditures."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="consumableEntryDate">Entry Date</Label>
              <Input
                id="consumableEntryDate"
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                required
                className="w-full sm:w-1/2"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consumableCode">Code</Label>
                <Input id="consumableCode" value={code} onChange={handleCodeChange} placeholder="e.g., 112" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumableReference">Reference</Label>
                <Input id="consumableReference" value={reference} readOnly placeholder="Auto-filled from code" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumableAmount">Total Amount (₹)</Label>
              <Input
                id="consumableAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 5000.00"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumableNotes">Notes (Optional)</Label>
              <Textarea
                id="consumableNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-grow bg-blue-700 hover:bg-blue-800"
                disabled={isSubmitting || consumablesLoading}
              >
                <Check className="mr-2 h-4 w-4" />{" "}
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Submitting..."
                  : isEditing
                    ? "Update Entry"
                    : "Submit Entry"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Consumables History</CardTitle>
          <CardDescription>{isAdmin ? "All entries." : "Your entries."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search consumables history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
            {consumablesLoading && consumableDeployments.length === 0 ? (
              <p className="text-center py-4">Loading history...</p>
            ) : filteredDeployments.length > 0 ? (
              filteredDeployments.map((d) => (
                <div key={d.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {d.code} - {d.reference}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        {formatDate(d.date, "long")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">₹{d.amount.toFixed(2)}</p>
                      {(isAdmin || user?.username === "KAB123") && (
                        <div className="flex gap-1 mt-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600"
                            onClick={() => handleEdit(d)}
                            disabled={isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this consumable entry.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(d.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                  {d.notes && (
                    <div className="mt-2 pt-2 border-t text-sm text-gray-600 flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5" />
                      <p className="whitespace-pre-wrap">{d.notes}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className={`mt-2 ${d.notes ? "pt-2 border-t" : ""}`}>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1.5" />
                        Recorded by: {d.user}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No consumable entries found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main Accounts Page Component ---
export default function AccountsPage() {
  const { isAdmin } = useAuth()
  const { deployments: laborDeployments, loading: laborLoading } = useLaborData()
  const { deployments: consumableDeployments, loading: consumablesLoading } = useConsumablesData()

  const [exportStartDate, setExportStartDate] = useState<string>("")
  const [exportEndDate, setExportEndDate] = useState<string>("")

  const combinedDeployments = useMemo(() => {
    const typedLaborDeployments = laborDeployments.map((d) => ({ ...d, entryType: "Labor" }))
    const typedConsumableDeployments = consumableDeployments.map((d) => ({ ...d, entryType: "Consumable" }))

    const allDeployments = [
      ...typedLaborDeployments,
      ...typedConsumableDeployments.map((cd) => ({ ...cd, totalCost: cd.amount })),
    ] as (
      | (LaborDeployment & { entryType: "Labor"; totalCost: number })
      | (ConsumableDeployment & { entryType: "Consumable"; totalCost: number })
    )[]

    // Default sort by date, will be re-sorted for export if needed
    return allDeployments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [laborDeployments, consumableDeployments])

  const getFilteredDeploymentsForExport = () => {
    let deploymentsToExport = [...combinedDeployments] // Create a copy to sort
    if (exportStartDate && exportEndDate) {
      const startDate = new Date(exportStartDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(exportEndDate)
      endDate.setHours(23, 59, 59, 999)
      if (startDate > endDate) {
        alert("Start date cannot be after end date.")
        return null
      }
      deploymentsToExport = deploymentsToExport.filter((d) => {
        const deploymentDate = new Date(d.date)
        return deploymentDate >= startDate && deploymentDate <= endDate
      })
    } else if (exportStartDate || exportEndDate) {
      alert("Please select both start and end date for filtering, or leave both empty to export all.")
      return null
    }

    if (deploymentsToExport.length === 0) {
      alert("No entries found for the selected date range.")
      return null
    }
    return deploymentsToExport
  }

  const exportCombinedCSV = () => {
    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return ""
      const stringField = String(field)
      if (stringField.search(/("|,|\n)/g) >= 0) return `"${stringField.replace(/"/g, '""')}"`
      return stringField
    }

    const deploymentsToExport = getFilteredDeploymentsForExport()
    if (!deploymentsToExport) return

    // Sort by code, then by date (newest first)
    deploymentsToExport.sort((a, b) => {
      if (a.code < b.code) return -1
      if (a.code > b.code) return 1
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    const headers = [
      "Date",
      "Entry Type",
      "Code",
      "Reference",
      "HF Labor Details",
      "Outside Labor Details",
      "Total Expenditure (₹)",
      "Notes",
      "Recorded By",
    ]

    const rows = deploymentsToExport.map((d) => {
      let hfLaborDetails = ""
      let outsideLaborDetails = ""
      if (d.entryType === "Labor" && d.laborEntries && d.laborEntries.length > 0) {
        const hfEntry = d.laborEntries[0]
        hfLaborDetails = `${hfEntry.laborCount} @ ${hfEntry.costPerLabor.toFixed(2)}`
        if (d.laborEntries.length > 1) {
          outsideLaborDetails = d.laborEntries
            .slice(1)
            .map((le: LaborEntry) => `${le.laborCount} @ ${le.costPerLabor.toFixed(2)}`)
            .join("; ")
        }
      }
      const expenditureAmount = d.entryType === "Labor" ? d.totalCost : (d as ConsumableDeployment).amount
      return [
        escapeCsvField(formatDate(d.date, "date-only")),
        escapeCsvField(d.entryType),
        escapeCsvField(d.code),
        escapeCsvField(d.reference),
        escapeCsvField(hfLaborDetails),
        escapeCsvField(outsideLaborDetails),
        escapeCsvField(expenditureAmount.toFixed(2)),
        escapeCsvField(d.notes),
        escapeCsvField(d.user),
      ]
    })

    let csvContent = "data:text/csv;charset=utf-8," + headers.map(escapeCsvField).join(",") + "\n"
    csvContent += rows.map((row) => row.join(",")).join("\n")

    // Calculate totals for summary section
    let totalHfLaborCount = 0,
      totalHfLaborCost = 0
    let totalOutsideLaborCount = 0,
      totalOutsideLaborCost = 0
    let totalConsumablesCost = 0
    const totalsByCode: { [code: string]: number } = {}

    deploymentsToExport.forEach((d) => {
      const expenditureAmount = d.entryType === "Labor" ? d.totalCost : (d as ConsumableDeployment).amount
      totalsByCode[d.code] = (totalsByCode[d.code] || 0) + expenditureAmount

      if (d.entryType === "Labor") {
        if (d.laborEntries && d.laborEntries.length > 0) {
          const hfEntry = d.laborEntries[0]
          totalHfLaborCount += hfEntry.laborCount
          totalHfLaborCost += hfEntry.laborCount * hfEntry.costPerLabor
        }
        if (d.laborEntries && d.laborEntries.length > 1) {
          d.laborEntries.slice(1).forEach((le) => {
            totalOutsideLaborCount += le.laborCount
            totalOutsideLaborCost += le.laborCount * le.costPerLabor
          })
        }
      } else {
        totalConsumablesCost += (d as ConsumableDeployment).amount
      }
    })
    const grandTotal = totalHfLaborCost + totalOutsideLaborCost + totalConsumablesCost

    // Add summary rows (HF, Outside, Consumables, Grand Total)
    csvContent += "\n" // Blank line
    const summaryHeaders = ["", "", "", "Summary Category", "Count/Details", "", "Total (₹)", "", ""]
    csvContent += "\n" + summaryHeaders.map(escapeCsvField).join(",")

    const hfSummaryRow = [
      "",
      "",
      "",
      "Total HF Labor",
      `${totalHfLaborCount} laborers`,
      "",
      totalHfLaborCost.toFixed(2),
      "",
      "",
    ]
    csvContent += "\n" + hfSummaryRow.map(escapeCsvField).join(",")
    const outsideSummaryRow = [
      "",
      "",
      "",
      "Total Outside Labor",
      "",
      `${totalOutsideLaborCount} laborers`,
      totalOutsideLaborCost.toFixed(2),
      "",
      "",
    ]
    csvContent += "\n" + outsideSummaryRow.map(escapeCsvField).join(",")
    const consumablesSummaryRow = ["", "", "", "Total Consumables", "", "", totalConsumablesCost.toFixed(2), "", ""]
    csvContent += "\n" + consumablesSummaryRow.map(escapeCsvField).join(",")
    const totalRow = ["", "", "", "GRAND TOTAL", "", "", grandTotal.toFixed(2), "", ""]
    csvContent += "\n" + totalRow.map(escapeCsvField).join(",")

    // Add Summary by Expenditure Code section
    csvContent += "\n\n" // Two blank lines
    csvContent += escapeCsvField("Summary by Expenditure Code") + ",,,\n" // Header for this section
    const codeSummaryHeaders = ["Code", "Reference", "Total Expenditure (₹)"]
    csvContent += codeSummaryHeaders.map(escapeCsvField).join(",") + "\n"

    Object.entries(totalsByCode)
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB)) // Sort by code
      .forEach(([code, totalAmount]) => {
        const reference = expenditureCodeMap[code] || "N/A"
        const codeRow = [escapeCsvField(code), escapeCsvField(reference), escapeCsvField(totalAmount.toFixed(2))]
        csvContent += codeRow.join(",") + "\n"
      })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const dateSuffix = exportStartDate && exportEndDate ? `${exportStartDate}_to_${exportEndDate}` : "all_entries"
    link.setAttribute("download", `accounts_summary_${dateSuffix}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportQIF = () => {
    const deploymentsToExport = getFilteredDeploymentsForExport()
    if (!deploymentsToExport) return

    let qifContent = "!Type:Bank\n" // Standard header for bank/cash expenses

    deploymentsToExport
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // QIF often expects chronological
      .forEach((d) => {
        const date = formatDate(d.date, "qif")
        const amount = d.entryType === "Labor" ? d.totalCost : (d as ConsumableDeployment).amount
        const payee = d.reference // Using the reference as payee
        const category = d.code // Expenditure code as category

        let memo = d.notes || ""
        if (d.entryType === "Labor" && d.laborEntries) {
          const hfDetail = d.laborEntries[0]
            ? `HF: ${d.laborEntries[0].laborCount}@${d.laborEntries[0].costPerLabor.toFixed(2)}`
            : ""
          const outsideDetail = d.laborEntries
            .slice(1)
            .map((le) => `OS${d.laborEntries.indexOf(le)}: ${le.laborCount}@${le.costPerLabor.toFixed(2)}`)
            .join("; ")
          memo = `${hfDetail}${hfDetail && outsideDetail ? "; " : ""}${outsideDetail}${memo ? " | Notes: " + memo : ""}`
        }

        qifContent += `D${date}\n`
        qifContent += `T-${amount.toFixed(2)}\n` // Amount is negative for expenses
        qifContent += `P${payee}\n`
        qifContent += `L${category}\n`
        if (memo) qifContent += `M${memo}\n`
        qifContent += "^\n" // End of transaction
      })

    const encodedUri = encodeURI("data:application/qif;charset=utf-8," + qifContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const dateSuffix = exportStartDate && exportEndDate ? `${exportStartDate}_to_${exportEndDate}` : "all_entries"
    link.setAttribute("download", `accounts_export_${dateSuffix}.qif`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Combined Accounts Export</CardTitle>
            <CardDescription>Export both labor and consumable entries to a single CSV or QIF file.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-2 flex-wrap">
            <Label htmlFor="exportStartDateCombined" className="text-sm font-medium">
              From:
            </Label>
            <Input
              type="date"
              id="exportStartDateCombined"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="h-9 text-sm"
              aria-label="Combined export start date"
            />
            <Label htmlFor="exportEndDateCombined" className="text-sm font-medium">
              To:
            </Label>
            <Input
              type="date"
              id="exportEndDateCombined"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="h-9 text-sm"
              aria-label="Combined export end date"
            />
            <Button
              onClick={exportCombinedCSV}
              variant="outline"
              size="sm"
              disabled={combinedDeployments.length === 0 || laborLoading || consumablesLoading}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={exportQIF}
              variant="outline"
              size="sm"
              disabled={combinedDeployments.length === 0 || laborLoading || consumablesLoading}
              className="w-full sm:w-auto"
            >
              <Coins className="mr-2 h-4 w-4" /> Export QIF
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="labor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="labor">
            <ClipboardList className="mr-2 h-4 w-4" /> Labor Deployments
          </TabsTrigger>
          <TabsTrigger value="consumables">
            <Droplets className="mr-2 h-4 w-4" /> Consumable Entries
          </TabsTrigger>
        </TabsList>
        <TabsContent value="labor" className="mt-4">
          <LaborSection />
        </TabsContent>
        <TabsContent value="consumables" className="mt-4">
          <ConsumablesSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Keep backward-compatibility for code that still imports
// "@/components/labor-deployment-tab".
export { LaborSection as LaborDeploymentTab }
