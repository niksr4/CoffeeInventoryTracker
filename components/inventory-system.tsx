"use client"

import type React from "react"

import { useState } from "react"
import { Plus, AlertTriangle, Download, RefreshCw, IndianRupee, Pencil } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

import { toast } from "@/hooks/use-toast"
import { useInventoryData } from "@/hooks/use-inventory-data"
import { useLaborData } from "@/hooks/use-labor-data"
import { InventoryValueSummary } from "./inventory-value-summary"
import { LaborDeploymentTab } from "./labor-deployment-tab"

type InventoryItem = {
  name: string
  quantity: number
  unit: string
  price?: number
}

type TransactionType = "Depleting" | "Restocking" | "Item Deleted" | "Unit Change" | "Price Update" | "Item Edited"

type Transaction = {
  id: string
  itemType: string
  quantity: number
  transactionType: TransactionType
  notes: string
  date: string
  user: string
  unit: string
  price?: number
  totalCost?: number
}

const laborCodes = {
  "101a": "Writer Wage & Benefits",
  "101b": "Supervisor",
  "102": "Provident Fund, Insurance",
  "103": "Bonus Staff And Labour",
  "104": "Gratuity",
  "105": "Bungalow Servants",
  "106": "Leave With Wages",
  "107": "Sickness Benefit",
  "108": "Medical Exp Staff, Labour",
  "109": "Labour Welfare",
  "110": "Postage, Stationary",
  "111": "Watchman Estate, Drying Yard",
  "112": "Vehicle Running & Maint",
  "113": "Electricity",
  "115": "Machinery Maintenance",
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
  "141": "Arabica Processing & Drying",
  "143": "Arabica Irrigation",
  "150": "Drip line Maintenance",
  "151": "Robusta Weeding",
  "152": "Robusta Pruning, Handling",
  "153": "Pest Control, Berry Borer",
  "154": "Robusta Shade Temp, Perm.",
  "155": "Robusta, Cost Lime, Manure",
  "156": "Robusta Liming, Manuring",
  "157": "Robusta Spray",
  "158": "Robusta Fence Maint",
  "159": "Supplies Planting, Upkeep",
  "160": "Robusta Harvesting",
  "161": "Robusta Processing & Drying",
  "162": "Robusta Curing",
  "163": "Robusta Irrigation",
  "181": "Pepper Planting, Upkeep",
  "182": "Pepper Manuring",
  "183": "Pepper Pest & Disease Cont.",
  "184": "Pepper Harvest, Process, Pack",
  "185": "Compost Preparation",
  "191": "Paddy Cultivation",
  "200": "Arecanut Composting",
  "201": "Arecanut",
  "202": "Orange",
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
  "221": "Pests & Diseases",
  "222": "Fence (New Clearing)",
  "232": "Lent",
  "233": "Capital Account",
  "245": "Organic Compost Manure",
}

/* ------------ helpers ------------- */
const dateTimeNow = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const formatDateForExport = (d: string) => {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "")
}

const formatDateForQIF = (date: Date) => {
  const month = String(date.getMonth() + 1)
  const day = String(date.getDate())
  const year = String(date.getFullYear()).slice(-2)
  return `${month}/${day}'${year}`
}

const escapeCsvField = (field: any): string => {
  const str = String(field ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/* ------------ component ------------- */
export default function InventorySystem() {
  const { inventory, transactions, loading, error, addTransaction, refreshData, redisConnected } = useInventoryData()

  /* --------------------- filter out deleted items --------------------- */
  const deletedItems = new Set(
    (transactions || []).filter((t) => t.transactionType === "Item Deleted").map((t) => t.itemType),
  )
  const items: InventoryItem[] = (inventory || []).filter((it) => !deletedItems.has(it.name))

  const { deployments: laborDeployments } = useLaborData()

  /* --------------- STATE --------------- */
  const [newTxn, setNewTxn] = useState({
    itemType: "",
    quantity: 0,
    transactionType: "Restocking" as "Restocking" | "Depleting",
    notes: "",
    unit: "",
    price: "",
  })

  const [priceDlgOpen, setPriceDlgOpen] = useState(false)
  const [editDlgOpen, setEditDlgOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [newPrice, setNewPrice] = useState<number>(0)

  const [editFields, setEditFields] = useState({
    name: "",
    unit: "",
    price: 0,
  })

  /* --------------- derived totals --------------- */
  const totalLaborExpenses = (laborDeployments || []).reduce((s, d) => s + (d.totalCost || 0), 0)

  /* --------------- submit handlers --------------- */
  async function recordTransaction(txn: Transaction, successMsg: string) {
    const ok = await addTransaction(txn)
    if (ok) {
      toast({ title: "Success", description: successMsg })
      refreshData(true)
    } else {
      toast({
        title: "Error",
        description: "Operation failed.  Please try again.",
        variant: "destructive",
      })
    }
  }

  async function submitNewTxn(e: React.FormEvent) {
    e.preventDefault()
    if (!newTxn.itemType || newTxn.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields with valid values.",
        variant: "destructive",
      })
      return
    }
    let pricePerUnit = 0
    if (newTxn.transactionType === "Restocking" && newTxn.price) {
      pricePerUnit = Number(newTxn.price)
    } else if (newTxn.transactionType === "Depleting") {
      pricePerUnit = items.find((i) => i.name === newTxn.itemType)?.price || 0
    }

    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      itemType: newTxn.itemType,
      quantity: newTxn.quantity,
      transactionType: newTxn.transactionType,
      notes: newTxn.notes,
      date: dateTimeNow(),
      user: "admin",
      unit: newTxn.unit || items.find((i) => i.name === newTxn.itemType)?.unit || "kg",
      price: pricePerUnit,
      totalCost: pricePerUnit * newTxn.quantity,
    }
    await recordTransaction(txn, "Transaction recorded.")
    setNewTxn({
      itemType: "",
      quantity: 0,
      transactionType: newTxn.transactionType,
      notes: "",
      unit: "",
      price: "",
    })
  }

  async function submitPriceUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return
    const txn: Transaction = {
      id: `price-${Date.now()}`,
      itemType: selectedItem.name,
      quantity: 0,
      transactionType: "Price Update",
      notes: `Price changed from ₹${selectedItem.price || 0} to ₹${newPrice}`,
      date: dateTimeNow(),
      user: "admin",
      unit: selectedItem.unit,
      price: newPrice,
    }
    setPriceDlgOpen(false)
    await recordTransaction(txn, `Price updated for ${selectedItem.name}.`)
    setSelectedItem(null)
  }

  async function submitItemEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return
    const { name, unit, price } = editFields
    const changes: string[] = []
    if (name !== selectedItem.name) changes.push(`name to "${name}"`)
    if (unit !== selectedItem.unit) changes.push(`unit to "${unit}"`)
    if (price !== (selectedItem.price || 0)) changes.push(`price to ₹${price}`)
    const note = `Edited: ${changes.join(", ")}`
    const txn: Transaction = {
      id: `edit-${Date.now()}`,
      itemType: selectedItem.name,
      quantity: 0,
      transactionType: "Item Edited",
      notes: note,
      date: dateTimeNow(),
      user: "admin",
      unit,
      price,
    }
    setEditDlgOpen(false)
    await recordTransaction(txn, `Item "${selectedItem.name}" updated.`)
    setSelectedItem(null)
  }

  /* --------------- export helpers --------------- */
  function exportInventoryCSV() {
    const csv = [
      ["Item Name", "Qty", "Unit", "Price", "Value"],
      ...items.map((i) => [
        i.name,
        i.quantity,
        i.unit,
        (i.price || 0).toFixed(2),
        ((i.price || 0) * i.quantity).toFixed(2),
      ]),
    ]
      .map((r) => r.map(escapeCsvField).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const exportLaborToQIF = () => {
    if (!laborDeployments || laborDeployments.length === 0) {
      toast({
        title: "No Data",
        description: "There is no labor deployment data to export.",
        variant: "destructive",
      })
      return
    }

    let qifContent = "!Type:Bank\n"
    laborDeployments.forEach((deployment) => {
      const date = new Date(deployment.date)
      qifContent += `D${formatDateForQIF(date)}\n`
      qifContent += `T-${deployment.totalCost.toFixed(2)}\n`
      qifContent += `P${laborCodes[deployment.reference as keyof typeof laborCodes] || deployment.reference}\n`
      if (deployment.notes) {
        qifContent += `M${deployment.notes}\n`
      }
      qifContent += "^\n"
    })

    const blob = new Blob([qifContent], { type: "application/qif" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `labor_export_${new Date().toISOString().split("T")[0]}.qif`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportExpenditureReportToCSV = () => {
    const laborExpenditures = (laborDeployments || []).map((d) => {
      const hfLaborDetails = d.laborEntries
        .filter((le) => le.costPerLabor === 475)
        .map((le) => `${le.laborCount} @ ${le.costPerLabor.toFixed(2)}`)
        .join("; ")

      const outsideLaborDetails = d.laborEntries
        .filter((le) => le.costPerLabor === 450)
        .map((le) => `${le.laborCount} @ ${le.costPerLabor.toFixed(2)}`)
        .join("; ")

      return {
        date: d.date,
        entryType: "Labor",
        code: d.reference,
        reference: laborCodes[d.reference as keyof typeof laborCodes] || d.reference,
        hfLaborDetails,
        outsideLaborDetails,
        totalExpenditure: d.totalCost,
        notes: d.notes || "",
        recordedBy: d.user,
      }
    })

    const consumableExpenditures = (transactions || [])
      .filter((t) => t.transactionType === "Depleting" && t.totalCost && t.totalCost > 0)
      .map((t) => ({
        date: t.date,
        entryType: "Consumable",
        code: "", // No code for consumables in the current model
        reference: t.itemType,
        hfLaborDetails: "",
        outsideLaborDetails: "",
        totalExpenditure: t.totalCost,
        notes: t.notes || "",
        recordedBy: t.user,
      }))

    const allExpenditures = [...laborExpenditures, ...consumableExpenditures].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

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

    const rows = allExpenditures.map((item) =>
      [
        formatDateForExport(item.date),
        item.entryType,
        item.code,
        item.reference,
        item.hfLaborDetails,
        item.outsideLaborDetails,
        item.totalExpenditure.toFixed(2),
        item.notes,
        item.recordedBy,
      ]
        .map(escapeCsvField)
        .join(","),
    )

    const totalLabor = laborExpenditures.reduce((sum, item) => sum + item.totalExpenditure, 0)
    const totalConsumables = consumableExpenditures.reduce((sum, item) => sum + item.totalExpenditure, 0)
    const grandTotal = totalLabor + totalConsumables

    const expenditureByCode = allExpenditures.reduce(
      (acc, item) => {
        const key = item.code || item.reference
        if (!acc[key]) {
          acc[key] = { reference: item.reference, total: 0 }
        }
        acc[key].total += item.totalExpenditure
        return acc
      },
      {} as Record<string, { reference: string; total: number }>,
    )

    let summaryContent = "\n\nSummary by Expenditure Code\n"
    summaryContent += "Code,Reference,Total Expenditure (₹)\n"
    for (const key in expenditureByCode) {
      const row = [key, expenditureByCode[key].reference, expenditureByCode[key].total.toFixed(2)]
      summaryContent += row.map(escapeCsvField).join(",") + "\n"
    }

    summaryContent += "\n\nSummary Category,Count/Details,Total (₹)\n"
    summaryContent += `Total HF Labor,${laborExpenditures.length} laborers,${totalLabor.toFixed(2)}\n`
    summaryContent += `Total Consumables,,${totalConsumables.toFixed(2)}\n`
    summaryContent += `GRAND TOTAL,,${grandTotal.toFixed(2)}\n`

    const csvContent = headers.join(",") + "\n" + rows.join("\n") + summaryContent
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `expenditure_report_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /* --------------- ui fallbacks --------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <RefreshCw className="animate-spin h-6 w-6 mr-2" />
        Loading inventory…
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => refreshData(true)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </Button>
      </div>
    )
  }

  /* --------------- ui --------------- */
  return (
    <div className="space-y-6">
      {redisConnected === false && (
        <div role="alert" className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Database connection error</p>
          <p>Could not reach Redis. Data may be stale.</p>
        </div>
      )}

      <InventoryValueSummary items={items} transactions={transactions || []} totalLaborExpenses={totalLaborExpenses} />

      {/* ---------- main tabs ---------- */}
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
        </TabsList>

        {/* -------- INVENTORY TAB -------- */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* add transaction card */}
            <Card>
              <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
                <CardDescription>Record stock in / out</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitNewTxn} className="space-y-4">
                  {/* item select */}
                  <div>
                    <Label>Item</Label>
                    <Select
                      value={newTxn.itemType}
                      onValueChange={(v) => {
                        const it = items.find((i) => i.name === v)
                        setNewTxn({
                          ...newTxn,
                          itemType: v,
                          unit: it?.unit || "",
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.name} value={i.name}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* qty */}
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={newTxn.quantity || ""}
                      onChange={(e) =>
                        setNewTxn({
                          ...newTxn,
                          quantity: Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* unit */}
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={newTxn.unit}
                      placeholder="kg / L / bags"
                      onChange={(e) => setNewTxn({ ...newTxn, unit: e.target.value })}
                    />
                  </div>

                  {/* type */}
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newTxn.transactionType}
                      onValueChange={(v) =>
                        setNewTxn({
                          ...newTxn,
                          transactionType: v as "Restocking" | "Depleting",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restocking">Restock</SelectItem>
                        <SelectItem value="Depleting">Deplete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newTxn.transactionType === "Restocking" && (
                    <div>
                      <Label>Price / unit (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newTxn.price}
                        onChange={(e) => setNewTxn({ ...newTxn, price: e.target.value })}
                      />
                    </div>
                  )}

                  {/* notes */}
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={newTxn.notes} onChange={(e) => setNewTxn({ ...newTxn, notes: e.target.value })} />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Record
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* quick actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your inventory and labor data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportExpenditureReportToCSV} variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Expenditure Report
                </Button>
                <Button onClick={exportLaborToQIF} variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Labor to QIF
                </Button>
                <Button onClick={exportInventoryCSV} variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Inventory to CSV
                </Button>
                <Button onClick={() => refreshData(true)} variant="outline" className="w-full bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* inventory table */}
          <Card>
            <CardHeader>
              <CardTitle>Current inventory</CardTitle>
              <CardDescription>{items.length} records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price (₹)</TableHead>
                      <TableHead>Value (₹)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.name}>
                        <TableCell className="font-medium">{it.name}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{it.unit}</TableCell>
                        <TableCell>₹{(it.price || 0).toFixed(2)}</TableCell>
                        <TableCell>₹{((it.price || 0) * it.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={it.quantity === 0 ? "destructive" : it.quantity < 10 ? "secondary" : "default"}
                          >
                            {it.quantity === 0 ? "Out" : it.quantity < 10 ? "Low" : "OK"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(it)
                              setNewPrice(it.price || 0)
                              setPriceDlgOpen(true)
                            }}
                          >
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Price
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(it)
                              setEditFields({
                                name: it.name,
                                unit: it.unit,
                                price: it.price || 0,
                              })
                              setEditDlgOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- TRANSACTIONS TAB -------- */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction history</CardTitle>
              <CardDescription>{(transactions || []).length} entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty / Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(transactions || []).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{formatDateForExport(t.date)}</TableCell>
                        <TableCell>{t.itemType}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              t.transactionType === "Restocking"
                                ? "default"
                                : t.transactionType === "Depleting"
                                  ? "secondary"
                                  : t.transactionType === "Price Update"
                                    ? "outline"
                                    : "destructive"
                            }
                          >
                            {t.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.transactionType === "Price Update" ? `₹${t.price?.toFixed(2)}` : t.quantity}
                        </TableCell>
                        <TableCell>{t.unit}</TableCell>
                        <TableCell>{t.notes}</TableCell>
                        <TableCell>{t.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- LABOR TAB -------- */}
        <TabsContent value="labor">
          <LaborDeploymentTab />
        </TabsContent>
      </Tabs>

      {/* ---------- price dialog ---------- */}
      <Dialog open={priceDlgOpen} onOpenChange={setPriceDlgOpen}>
        <DialogContent>
          <form onSubmit={submitPriceUpdate}>
            <DialogHeader>
              <DialogTitle>Update price</DialogTitle>
              <DialogDescription>
                {selectedItem?.name} – current ₹{(selectedItem?.price || 0).toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Label>New price (₹)</Label>
              <Input
                type="number"
                value={newPrice}
                min="0"
                step="0.01"
                onChange={(e) => setNewPrice(Number(e.target.value))}
                required
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setPriceDlgOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- edit item dialog ---------- */}
      <Dialog open={editDlgOpen} onOpenChange={setEditDlgOpen}>
        <DialogContent>
          <form onSubmit={submitItemEdit}>
            <DialogHeader>
              <DialogTitle>Edit item details</DialogTitle>
              <DialogDescription>Update name, unit or price for {selectedItem?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editFields.name}
                  onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={editFields.unit}
                  onChange={(e) => setEditFields({ ...editFields, unit: e.target.value })}
                />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFields.price}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditDlgOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
