"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLaborData, type LaborEntry, type ConsumableEntry, type LaborDeployment } from "@/hooks/use-labor-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Check,
  Search,
  Users,
  Download,
  PlusCircle,
  XCircle,
  MessageSquare,
  Edit,
  Trash2,
  CalendarDays,
} from "lucide-react"

const laborCodeMap: { [key: string]: string } = {
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
  "112": "Vehicle Running & Maint",
  "113": "Electricity",
  "115": "Machinary Maintenance",
  "116": "Land",
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
  "136": "Arabica Lime, Manuring",
  "137": "Arabica Spraying",
  "138": "Arabica Fence",
  "139": "Arabica Supplies, Upkeep",
  "140": "Arabica Harvesting",
  "141": "Arabica Processing & Drying",
  "143": "Arabica Irrigation",
  "148": "Kgs. @Rs.190.20",
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
  "181": "Pepper Planting, Upkeep",
  "200": "Areecanut composting",
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
  "219": "Lime",
  "220": "Weeding - (New Clearing)",
  "221": "Pests & Diseses",
  "222": "Fence (New Clearing)",
  "232": "Lent",
  "233": "Capital Account",
  "245": "Organic Compost Manure",
}

const formatDate = (dateString?: string, style: "short" | "long" = "short") => {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const options: Intl.DateTimeFormatOptions =
      style === "short"
        ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }
        : { dateStyle: "medium", timeStyle: "short" }
    return new Intl.DateTimeFormat("en-GB", options).format(date)
  } catch (error) {
    return dateString
  }
}

// For form state, values are strings
type FormLaborEntry = { laborCount: string; costPerLabor: string }
type FormConsumableEntry = { name: string; quantity: string; unit: string; costPerUnit: string }

const CURRENT_YEAR = new Date().getFullYear()
const IS_PRESET_YEAR = CURRENT_YEAR === 2025 // Keep this for preset costs

const getInitialCostForLaborGroup = (index: number): string => {
  if (IS_PRESET_YEAR) {
    if (index === 0) return "475" // HF Labour
    return "450" // Outside Labour
  }
  return "0"
}

const initialLaborEntry = (): FormLaborEntry => ({ laborCount: "", costPerLabor: getInitialCostForLaborGroup(0) })
const initialConsumableEntry = (): FormConsumableEntry => ({ name: "", quantity: "", unit: "", costPerUnit: "" })

export default function LaborDeploymentTab() {
  const { user, isAdmin } = useAuth()
  const { deployments, loading, addDeployment, updateDeployment, deleteDeployment } = useLaborData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditDeployment, setCurrentEditDeployment] = useState<LaborDeployment | null>(null)

  // Form state
  const [deploymentDate, setDeploymentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [code, setCode] = useState("")
  const [reference, setReference] = useState("")
  const [laborEntries, setLaborEntries] = useState<FormLaborEntry[]>([initialLaborEntry()])
  const [otherConsumables, setOtherConsumables] = useState<FormConsumableEntry[]>([])
  const [notes, setNotes] = useState("")

  // History state
  const [searchTerm, setSearchTerm] = useState("")
  const [exportStartDate, setExportStartDate] = useState<string>("")
  const [exportEndDate, setExportEndDate] = useState<string>("")

  const resetForm = () => {
    setDeploymentDate(new Date().toISOString().split("T")[0])
    setCode("")
    setReference("")
    setLaborEntries([initialLaborEntry()])
    setOtherConsumables([])
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
      setOtherConsumables(
        currentEditDeployment.otherConsumables?.map((oc) => ({
          name: oc.name,
          quantity: String(oc.quantity),
          unit: oc.unit,
          costPerUnit: String(oc.costPerUnit),
        })) || [],
      )
      setNotes(currentEditDeployment.notes || "")
    } else {
      resetForm()
    }
  }, [currentEditDeployment])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setReference(laborCodeMap[newCode] || "")
  }

  // Labor Entries Management
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
    if (laborEntries.length > 0) {
      // Allow removing the last one if consumables exist or if it's not the only entry type
      const updatedEntries = laborEntries.filter((_, i) => i !== index)
      setLaborEntries(updatedEntries)
    }
  }

  // Other Consumables Management
  const handleConsumableChange = (index: number, field: keyof FormConsumableEntry, value: string) => {
    const updatedConsumables = [...otherConsumables]
    updatedConsumables[index][field] = value
    setOtherConsumables(updatedConsumables)
  }
  const addConsumableField = () => setOtherConsumables([...otherConsumables, initialConsumableEntry()])
  const removeConsumableField = (index: number) => {
    const updatedConsumables = otherConsumables.filter((_, i) => i !== index)
    setOtherConsumables(updatedConsumables)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !reference || !user || !deploymentDate) {
      alert("Please fill in Date, Code, and Reference.")
      return
    }
    if (laborEntries.length === 0 && otherConsumables.length === 0) {
      alert("Please add at least one labor group or one consumable item.")
      return
    }
    if (laborEntries.some((entry) => !entry.laborCount || Number(entry.laborCount) <= 0) && laborEntries.length > 0) {
      alert("Please ensure all labor groups have a valid number of laborers.")
      return
    }
    if (
      otherConsumables.some(
        (c) => !c.name || !c.quantity || Number(c.quantity) <= 0 || !c.unit || c.costPerUnit === "",
      ) &&
      otherConsumables.length > 0
    ) {
      alert("Please ensure all consumable entries have name, quantity, unit, and cost per unit.")
      return
    }

    setIsSubmitting(true)

    const numericLaborEntries: LaborEntry[] = laborEntries
      .map((entry) => ({
        laborCount: Number(entry.laborCount),
        costPerLabor: Number(entry.costPerLabor || "0"),
      }))
      .filter((entry) => entry.laborCount > 0)

    const numericConsumables: Omit<ConsumableEntry, "totalCost">[] = otherConsumables
      .map((c) => ({
        name: c.name,
        quantity: Number(c.quantity),
        unit: c.unit,
        costPerUnit: Number(c.costPerUnit || "0"),
      }))
      .filter((c) => c.quantity > 0 && c.name)

    const payload = {
      code,
      reference,
      laborEntries: numericLaborEntries,
      otherConsumables: numericConsumables.length > 0 ? numericConsumables : undefined,
      user: user.username,
      date: deploymentDate, // User-selected date
      notes,
    }

    let success = false
    if (isEditing && currentEditDeployment) {
      success = await updateDeployment(currentEditDeployment.id, payload)
    } else {
      success = await addDeployment(payload)
    }

    if (success) {
      resetForm()
    }
    setIsSubmitting(false)
  }

  const totalCost = useMemo(() => {
    let currentTotal = 0
    laborEntries.forEach((entry) => {
      const laborCount = Number(entry.laborCount)
      const costPerLabor = Number(entry.costPerLabor || "0")
      if (!isNaN(laborCount) && !isNaN(costPerLabor) && laborCount > 0) {
        currentTotal += laborCount * costPerLabor
      }
    })
    otherConsumables.forEach((c) => {
      const quantity = Number(c.quantity)
      const costPerUnit = Number(c.costPerUnit || "0")
      if (!isNaN(quantity) && !isNaN(costPerUnit) && quantity > 0) {
        currentTotal += quantity * costPerUnit
      }
    })
    return currentTotal.toFixed(2)
  }, [laborEntries, otherConsumables])

  const filteredDeployments = useMemo(() => {
    let deploymentsToFilter = deployments
    if (!isAdmin && user) {
      deploymentsToFilter = deployments.filter((d) => d.user === user.username)
    }
    if (!searchTerm) return deploymentsToFilter
    const lowercasedFilter = searchTerm.toLowerCase()
    return deploymentsToFilter.filter(
      (d) =>
        d.code.toLowerCase().includes(lowercasedFilter) ||
        d.reference.toLowerCase().includes(lowercasedFilter) ||
        d.user.toLowerCase().includes(lowercasedFilter) ||
        (d.notes && d.notes.toLowerCase().includes(lowercasedFilter)) ||
        (d.otherConsumables && d.otherConsumables.some((oc) => oc.name.toLowerCase().includes(lowercasedFilter))),
    )
  }, [deployments, searchTerm, isAdmin, user])

  const exportToCSV = () => {
    if (filteredDeployments.length === 0) return

    let deploymentsToExport = filteredDeployments
    if (exportStartDate && exportEndDate) {
      const startDate = new Date(exportStartDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(exportEndDate)
      endDate.setHours(23, 59, 59, 999)
      if (startDate > endDate) {
        alert("Start date cannot be after end date.")
        return
      }
      deploymentsToExport = deploymentsToExport.filter((d) => {
        const deploymentDate = new Date(d.date)
        return deploymentDate >= startDate && deploymentDate <= endDate
      })
    } else if (exportStartDate || exportEndDate) {
      alert("Please select both start and end date, or leave both empty.")
      return
    }
    if (deploymentsToExport.length === 0) {
      alert("No deployments for selected date range.")
      return
    }

    const headers = [
      "Date",
      "Code",
      "Reference",
      "Labor Details",
      "Consumables Details",
      "Total Cost (₹)",
      "Notes",
      "Recorded By",
    ]
    const rows = deploymentsToExport.map((d) => {
      const laborDetails =
        d.laborEntries.map((le) => `${le.laborCount} @ ${le.costPerLabor.toFixed(2)}`).join("; ") || "N/A"
      const consumablesDetails =
        d.otherConsumables
          ?.map(
            (oc) =>
              `${oc.name}: ${oc.quantity} ${oc.unit} @ ${oc.costPerUnit.toFixed(2)} (Total: ${oc.totalCost.toFixed(2)})`,
          )
          .join("; ") || "N/A"
      const notes = d.notes ? `"${d.notes.replace(/"/g, '""')}"` : ""
      return [
        formatDate(d.date),
        d.code,
        d.reference,
        laborDetails,
        consumablesDetails,
        d.totalCost.toFixed(2),
        notes,
        d.user,
      ]
    })
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
    csvContent += rows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const dateSuffix = exportStartDate && exportEndDate ? `${exportStartDate}_to_${exportEndDate}` : "all_time"
    link.setAttribute("download", `labor_deployments_${dateSuffix}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEdit = (deployment: LaborDeployment) => {
    setCurrentEditDeployment(deployment)
  }

  const handleDelete = async (deploymentId: string) => {
    setIsSubmitting(true) // Use same flag for delete operations
    const success = await deleteDeployment(deploymentId)
    if (success) {
      // Optionally clear edit form if the deleted item was being edited
      if (currentEditDeployment && currentEditDeployment.id === deploymentId) {
        resetForm()
      }
    }
    setIsSubmitting(false)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Labor Deployment" : "Record Labor Deployment"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Modify the details of the existing deployment."
              : "Enter details for labor and consumables. Use '+' to add multiple groups/items."}
            {IS_PRESET_YEAR &&
              !isEditing &&
              " Costs for HF Labour (475₹) and Outside Labour (450₹) are pre-filled for this year."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="deploymentDate">Deployment Date</Label>
              <Input
                id="deploymentDate"
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                required
                className="w-full sm:w-1/2"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={code} onChange={handleCodeChange} placeholder="e.g., 101" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" value={reference} readOnly placeholder="Auto-filled from code" />
              </div>
            </div>

            {/* Labor Entries Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Labor Entries</h3>
              {laborEntries.map((entry, index) => (
                <div key={`labor-${index}`} className="space-y-3 p-3 border rounded-md relative">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-600">
                      {index === 0 ? "HF Labour" : `Outside Labour ${index}`}
                    </p>
                    {laborEntries.length > 0 && ( // Show remove if more than one, or if consumables exist
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => removeLaborEntryField(index)}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Remove labor entry</span>
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
                        placeholder={
                          getInitialCostForLaborGroup(index) === "0"
                            ? "0"
                            : `e.g., ${getInitialCostForLaborGroup(index)}`
                        }
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLaborEntryField} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add {laborEntries.length === 0 ? "HF Labour" : "Outside Labour"}{" "}
                Group
              </Button>
            </div>

            {/* Other Consumables Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Other Entries / Consumables</h3>
              {otherConsumables.map((consumable, index) => (
                <div key={`consumable-${index}`} className="space-y-3 p-3 border rounded-md relative">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-600">Consumable {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={() => removeConsumableField(index)}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Remove consumable</span>
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`consumableName-${index}`}>Item Name</Label>
                      <Input
                        id={`consumableName-${index}`}
                        value={consumable.name}
                        onChange={(e) => handleConsumableChange(index, "name", e.target.value)}
                        placeholder="e.g., Diesel"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`consumableUnit-${index}`}>Unit</Label>
                      <Input
                        id={`consumableUnit-${index}`}
                        value={consumable.unit}
                        onChange={(e) => handleConsumableChange(index, "unit", e.target.value)}
                        placeholder="e.g., L, kg, pcs"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`consumableQty-${index}`}>Quantity</Label>
                      <Input
                        id={`consumableQty-${index}`}
                        type="number"
                        value={consumable.quantity}
                        onChange={(e) => handleConsumableChange(index, "quantity", e.target.value)}
                        placeholder="e.g., 20"
                        required
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`consumableCost-${index}`}>Cost per Unit (₹)</Label>
                      <Input
                        id={`consumableCost-${index}`}
                        type="number"
                        value={consumable.costPerUnit}
                        onChange={(e) => handleConsumableChange(index, "costPerUnit", e.target.value)}
                        placeholder="e.g., 90.50"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addConsumableField} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Consumable
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant notes..."
                className="min-h-[80px]"
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
                disabled={isSubmitting || loading}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                {isAdmin ? "Viewing all labor deployments." : "Viewing your labor deployments."}
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 w-full">
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="h-9 text-sm flex-grow"
                    aria-label="Export start date"
                  />
                  <span className="text-sm px-1">to</span>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="h-9 text-sm flex-grow"
                    aria-label="Export end date"
                  />
                </div>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  disabled={filteredDeployments.length === 0 || loading}
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by code, reference, user, notes, or consumables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            {" "}
            {/* Adjusted max-h */}
            {loading && deployments.length === 0 ? ( // Show loading only on initial load
              <p className="text-center py-4">Loading history...</p>
            ) : filteredDeployments.length > 0 ? (
              filteredDeployments.map((d) => (
                <div key={d.id} className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-base">
                        {d.code} - {d.reference}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                        {formatDate(d.date, "long")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-green-700">₹{d.totalCost.toFixed(2)}</p>
                      {isAdmin && (
                        <div className="flex gap-2 mt-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(d)}
                            disabled={isSubmitting}
                          >
                            <Edit className="h-4 w-4" /> <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:text-red-800"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the deployment entry for{" "}
                                  <span className="font-semibold">{d.reference}</span> on{" "}
                                  <span className="font-semibold">{formatDate(d.date)}</span>.
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

                  {d.laborEntries && d.laborEntries.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Labor:</p>
                      <div className="text-xs text-gray-600 ml-2">
                        {d.laborEntries.map((entry, idx) => (
                          <span key={`labor-${idx}`} className="block">
                            {idx === 0 ? "HF: " : `Outside ${idx}: `}
                            {entry.laborCount} laborers @ ₹{entry.costPerLabor.toFixed(2)} each
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.otherConsumables && d.otherConsumables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Consumables:</p>
                      <div className="text-xs text-gray-600 ml-2">
                        {d.otherConsumables.map((oc, idx) => (
                          <span key={`consumable-${idx}`} className="block">
                            {oc.name}: {oc.quantity} {oc.unit} @ ₹{oc.costPerUnit.toFixed(2)} (Total: ₹
                            {oc.totalCost.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.notes && (
                    <div className="mt-2 pt-2 border-t text-sm text-gray-600 flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-70" />
                      <p className="whitespace-pre-wrap">{d.notes}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className={`mt-2 ${d.notes ? "pt-2 border-t" : ""}`}>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1.5 opacity-70" />
                        Recorded by: {d.user}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No deployments found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
