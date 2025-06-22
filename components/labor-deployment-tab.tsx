"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLaborData } from "@/hooks/use-labor-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Search, Users, Download } from "lucide-react"

// As per the user's request, there are duplicate codes (e.g., 116).
// This map uses the first provided reference for any duplicate code.
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

export default function LaborDeploymentTab() {
  const { user, isAdmin } = useAuth()
  const { deployments, loading, addDeployment } = useLaborData()

  const [formState, setFormState] = useState({
    code: "",
    reference: "",
    laborCount: "",
    costPerLabor: "",
  })
  const [searchTerm, setSearchTerm] = useState("")

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    const reference = laborCodeMap[code] || ""
    setFormState((prev) => ({ ...prev, code, reference }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.code || !formState.reference || !formState.laborCount || !formState.costPerLabor || !user) return

    const success = await addDeployment({
      code: formState.code,
      reference: formState.reference,
      laborCount: Number(formState.laborCount),
      costPerLabor: Number(formState.costPerLabor),
      user: user.username,
    })

    if (success) {
      setFormState({ code: "", reference: "", laborCount: "", costPerLabor: "" })
    }
  }

  const totalCost = useMemo(() => {
    const laborCount = Number(formState.laborCount)
    const costPerLabor = Number(formState.costPerLabor)
    if (!isNaN(laborCount) && !isNaN(costPerLabor) && laborCount > 0 && costPerLabor > 0) {
      return (laborCount * costPerLabor).toFixed(2)
    }
    return "0.00"
  }, [formState.laborCount, formState.costPerLabor])

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

    const headers = [
      "ID",
      "Date",
      "Code",
      "Reference",
      "Labor Count",
      "Cost Per Laborer (₹)",
      "Total Cost (₹)",
      "Recorded By",
    ]
    const rows = filteredDeployments.map((d) => [
      d.id,
      formatDate(d.date),
      d.code,
      d.reference,
      d.laborCount,
      d.costPerLabor.toFixed(2),
      d.totalCost.toFixed(2),
      d.user,
    ])

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
    csvContent += rows.map((e) => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "labor_deployment_history.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Record Labor Deployment</CardTitle>
          <CardDescription>Enter the details for the labor deployed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={formState.code}
                  onChange={handleCodeChange}
                  placeholder="e.g., 101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" value={formState.reference} readOnly placeholder="Auto-filled" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laborCount">Number of Laborers</Label>
                <Input
                  id="laborCount"
                  name="laborCount"
                  type="number"
                  value={formState.laborCount}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerLabor">Cost per Laborer (₹)</Label>
                <Input
                  id="costPerLabor"
                  name="costPerLabor"
                  type="number"
                  value={formState.costPerLabor}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  required
                />
              </div>
            </div>
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
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
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
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-700">₹{d.totalCost.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {d.laborCount} × ₹{d.costPerLabor.toFixed(2)}
                      </p>
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
