"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLaborData, type LaborEntry } from "@/hooks/use-labor-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Search, Users, Download, PlusCircle, XCircle } from "lucide-react"

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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date)
  } catch (error) {
    return dateString
  }
}

type FormLaborEntry = {
  laborCount: string
  costPerLabor: string
}

const CURRENT_YEAR = new Date().getFullYear()
const IS_PRESET_YEAR = CURRENT_YEAR === 2025 // Assuming 2025 is the target year for presets

const getInitialCostForGroup = (index: number): string => {
  if (IS_PRESET_YEAR) {
    if (index === 0) return "475"
    if (index === 1) return "450"
  }
  return "0"
}

export default function LaborDeploymentTab() {
  const { user, isAdmin } = useAuth()
  const { deployments, loading, addDeployment } = useLaborData()

  const [code, setCode] = useState("")
  const [reference, setReference] = useState("")

  const [laborEntries, setLaborEntries] = useState<FormLaborEntry[]>([
    { laborCount: "", costPerLabor: getInitialCostForGroup(0) },
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [exportStartDate, setExportStartDate] = useState<string>("")
  const [exportEndDate, setExportEndDate] = useState<string>("")

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    setReference(laborCodeMap[newCode] || "")
  }

  const handleLaborEntryChange = (index: number, field: keyof FormLaborEntry, value: string) => {
    const updatedEntries = [...laborEntries]
    updatedEntries[index][field] = value
    setLaborEntries(updatedEntries)
  }

  const addLaborEntryField = () => {
    const newEntryIndex = laborEntries.length
    setLaborEntries([...laborEntries, { laborCount: "", costPerLabor: getInitialCostForGroup(newEntryIndex) }])
  }

  const removeLaborEntryField = (index: number) => {
    if (laborEntries.length > 1) {
      const updatedEntries = laborEntries.filter((_, i) => i !== index)
      setLaborEntries(updatedEntries)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !reference || !user || laborEntries.some((entry) => !entry.laborCount)) {
      // Cost per labor can be blank (will default to 0)
      alert("Please fill in Code, Reference, and Number of Laborers for all entries.")
      return
    }

    const numericLaborEntries: LaborEntry[] = laborEntries
      .map((entry) => ({
        laborCount: Number(entry.laborCount),
        costPerLabor: Number(entry.costPerLabor || "0"), // Default to 0 if blank
      }))
      .filter((entry) => entry.laborCount > 0) // Cost can be 0

    if (numericLaborEntries.length === 0) {
      alert("Please provide a valid number of laborers for at least one entry.")
      return
    }

    const success = await addDeployment({
      code,
      reference,
      laborEntries: numericLaborEntries,
      user: user.username,
    })

    if (success) {
      setCode("")
      setReference("")
      setLaborEntries([{ laborCount: "", costPerLabor: getInitialCostForGroup(0) }])
    }
  }

  const totalCost = useMemo(() => {
    return laborEntries
      .reduce((sum, entry) => {
        const laborCount = Number(entry.laborCount)
        const costPerLabor = Number(entry.costPerLabor || "0") // Default to 0 if blank
        if (!isNaN(laborCount) && !isNaN(costPerLabor) && laborCount > 0) {
          return sum + laborCount * costPerLabor
        }
        return sum
      }, 0)
      .toFixed(2)
  }, [laborEntries])

  const filteredDeployments = useMemo(() => {
    let deploymentsToFilter = deployments
    if (!isAdmin) {
      deploymentsToFilter = deployments.filter((d) => d.user === user?.username)
    }
    if (!searchTerm) {
      return deploymentsToFilter
    }
    const lowercasedFilter = searchTerm.toLowerCase()
    return deploymentsToFilter.filter(
      (d) =>
        d.code.toLowerCase().includes(lowercasedFilter) ||
        d.reference.toLowerCase().includes(lowercasedFilter) ||
        d.user.toLowerCase().includes(lowercasedFilter),
    )
  }, [deployments, searchTerm, isAdmin, user?.username])

  const exportToCSV = () => {
    if (!isAdmin || filteredDeployments.length === 0) return

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
      alert("Please select both a start and end date for the range, or leave both empty to export all.")
      return
    }

    if (deploymentsToExport.length === 0) {
      alert("No deployments found for the selected date range.")
      return
    }

    const headers = ["Date", "Reference", "Labor Details", "Total Cost (₹)", "Recorded By"]
    const rows = deploymentsToExport.map((d) => {
      const laborDetails = d.laborEntries.map((le) => `${le.laborCount} @ ${le.costPerLabor.toFixed(2)}`).join("; ")
      return [formatDate(d.date), d.reference, laborDetails, d.totalCost.toFixed(2), d.user]
    })

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
    csvContent += rows.map((e) => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `labor_deployment_history_${exportStartDate}_to_${exportEndDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Record Labor Deployment</CardTitle>
          <CardDescription>
            Enter the details for the labor deployed. Use '+' to add multiple labor groups for the same task.
            {IS_PRESET_YEAR && " Costs for Group 1 (475₹) and Group 2 (450₹) are pre-filled for this year."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g., 101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" value={reference} readOnly placeholder="Auto-filled" />
              </div>
            </div>

            {laborEntries.map((entry, index) => (
              <div key={index} className="space-y-3 p-3 border rounded-md relative">
                {laborEntries.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-red-500 hover:text-red-700"
                    onClick={() => removeLaborEntryField(index)}
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="sr-only">Remove labor entry</span>
                  </Button>
                )}
                <p className="text-sm font-medium text-gray-600">Labor Group {index + 1}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`laborCount-${index}`}>Number of Laborers</Label>
                    <Input
                      id={`laborCount-${index}`}
                      name={`laborCount-${index}`}
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
                      name={`costPerLabor-${index}`}
                      type="number"
                      value={entry.costPerLabor}
                      onChange={(e) => handleLaborEntryChange(index, "costPerLabor", e.target.value)}
                      placeholder={
                        getInitialCostForGroup(index) === "0" ? "0" : `e.g., ${getInitialCostForGroup(index)}`
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLaborEntryField} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Labor Group
            </Button>

            <div className="p-4 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-green-700">₹{totalCost}</p>
            </div>
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-800">
              <Check className="mr-2 h-4 w-4" /> Submit Deployment
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                {isAdmin ? "Viewing all labor deployments." : "Viewing your labor deployments."}
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="h-9 text-sm"
                    aria-label="Export start date"
                  />
                  <span className="text-sm">to</span>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="h-9 text-sm"
                    aria-label="Export end date"
                  />
                </div>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  disabled={filteredDeployments.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by code, reference, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <p>Loading history...</p>
            ) : filteredDeployments.length > 0 ? (
              filteredDeployments.map((d) => (
                <div key={d.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {d.code} - {d.reference}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(d.date)}</p>
                      <div className="text-xs text-gray-600 mt-1">
                        {d.laborEntries.map((entry, idx) => (
                          <span key={idx} className="block">
                            {entry.laborCount} laborers @ ₹{entry.costPerLabor.toFixed(2)} each
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-700">₹{d.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1.5" />
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
