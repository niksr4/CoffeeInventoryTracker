"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2, Save, Trash2, Download, IndianRupee, TrendingUp, Pencil } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentFiscalYear, getAvailableFiscalYears, getFiscalYearDateRange, type FiscalYear } from "@/lib/fiscal-year-utils"

interface SalesRecord {
  id?: number
  sale_date: string
  coffee_type: string
  batch_no: string
  estate: string
  bags_sent: number
  kgs: number
  bags_sold: number
  price_per_bag: number
  revenue: number
  bank_account: string | null
  notes: string | null
}

interface DispatchTotals {
  arabica: number // in KGs
  robusta: number // in KGs
}

const COFFEE_TYPES = ["Arabica", "Robusta"]
const ESTATES = ["HF A", "HF B", "HF C", "MV"]
const BATCH_NOS = ["hfa", "hfb", "hfc", "mv"]

export default function SalesTab() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear>(getCurrentFiscalYear())
  const availableFiscalYears = getAvailableFiscalYears()
  
  const [date, setDate] = useState<Date>(new Date())
  const [coffeeType, setCoffeeType] = useState<string>("Arabica")
  const [batchNo, setBatchNo] = useState<string>("")
  const [estate, setEstate] = useState<string>("HF A")
  const [bagsSent, setBagsSent] = useState<string>("")
  const [bagsSold, setBagsSold] = useState<string>("")
  const [pricePerBag, setPricePerBag] = useState<string>("")
  const [bankAccount, setBankAccount] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  
  // Auto-calculate kgs as bags sent x 50
  const kgs = bagsSent ? Number(bagsSent) * 50 : 0
  // Auto-calculate revenue as bags sold x price per bag
  const calculatedRevenue = bagsSold && pricePerBag ? Number(bagsSold) * Number(pricePerBag) : 0
  
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([])
  const [dispatchTotals, setDispatchTotals] = useState<DispatchTotals>({ arabica: 0, robusta: 0 })
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Calculate sold amounts by coffee type
  const calculateSoldTotals = useCallback(() => {
    const sold = { arabica: 0, robusta: 0 }
    
    salesRecords.forEach((record) => {
      const kgsSold = Number(record.bags_sold) * 50 // Convert bags to KGs
      if (record.coffee_type === "Arabica") {
        sold.arabica += kgsSold
      } else if (record.coffee_type === "Robusta") {
        sold.robusta += kgsSold
      }
    })
    
    return sold
  }, [salesRecords])

  // Calculate available inventory (dispatched - sold)
  const calculateAvailable = useCallback(() => {
    const sold = calculateSoldTotals()
    return {
      arabica: Math.max(0, dispatchTotals.arabica - sold.arabica),
      robusta: Math.max(0, dispatchTotals.robusta - sold.robusta),
    }
  }, [dispatchTotals, calculateSoldTotals])

  // Calculate totals from sales records
  const calculateTotals = useCallback(() => {
    const totals = {
      totalBagsSent: 0,
      totalKgs: 0,
      totalBagsSold: 0,
      totalRevenue: 0,
    }

    salesRecords.forEach((record) => {
      totals.totalBagsSent += Number(record.bags_sent)
      totals.totalKgs += Number(record.kgs)
      totals.totalBagsSold += Number(record.bags_sold)
      totals.totalRevenue += Number(record.revenue)
    })

    return totals
  }, [salesRecords])

  // Fetch dispatched totals from dispatch records
  const fetchDispatchedTotals = useCallback(async () => {
    try {
      const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
      const response = await fetch(`/api/dispatch?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()

      if (data.success && data.records) {
        const totals = { arabica: 0, robusta: 0 }

        data.records.forEach((record: { coffee_type: string; bags_dispatched: number }) => {
          const kgs = Number(record.bags_dispatched) * 50 // Convert bags to KGs
          if (record.coffee_type === "Arabica") {
            totals.arabica += kgs
          } else if (record.coffee_type === "Robusta") {
            totals.robusta += kgs
          }
        })

        setDispatchTotals(totals)
      }
    } catch (error) {
      console.error("Error fetching dispatched totals:", error)
    }
  }, [selectedFiscalYear])

  // Fetch sales records
  const fetchSalesRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
      const response = await fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()
      
      if (data.success) {
        setSalesRecords(data.records || [])
      } else {
        console.error("Error fetching sales records:", data.error)
      }
    } catch (error) {
      console.error("Error fetching sales records:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedFiscalYear])

  useEffect(() => {
    fetchDispatchedTotals()
    fetchSalesRecords()
  }, [fetchDispatchedTotals, fetchSalesRecords])

  const handleSave = async () => {
    if (!bagsSent || Number(bagsSent) <= 0) {
      toast({
        title: "Error",
        description: "Please enter the number of bags sent",
        variant: "destructive",
      })
      return
    }

    if (!bagsSold || Number(bagsSold) <= 0) {
      toast({
        title: "Error",
        description: "Please enter the number of bags sold",
        variant: "destructive",
      })
      return
    }

    if (!pricePerBag || Number(pricePerBag) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price per bag",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const method = editingRecord ? "PUT" : "POST"
      const response = await fetch("/api/sales", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord?.id,
          sale_date: format(date, "yyyy-MM-dd"),
          coffee_type: coffeeType,
          batch_no: batchNo || null,
          estate: estate,
          bags_sent: Number(bagsSent),
          kgs: kgs,
          bags_sold: Number(bagsSold),
          price_per_bag: Number(pricePerBag),
          revenue: calculatedRevenue,
          bank_account: bankAccount || null,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingRecord ? "Sales record updated successfully" : "Sales record saved successfully",
        })
        // Reset form
        resetForm()
        // Refresh records
        fetchSalesRecords()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save sales record",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sales record",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setCoffeeType("Arabica")
    setBatchNo("")
    setEstate("HF A")
    setBagsSent("")
    setBagsSold("")
    setPricePerBag("")
    setBankAccount("")
    setNotes("")
    setEditingRecord(null)
  }

  const handleEdit = (record: SalesRecord) => {
    setEditingRecord(record)
    setDate(new Date(record.sale_date))
    setCoffeeType(record.coffee_type || "Arabica")
    setBatchNo(record.batch_no || "")
    setEstate(record.estate || "HF A")
    setBagsSent(record.bags_sent.toString())
    setBagsSold(record.bags_sold.toString())
    setPricePerBag(record.price_per_bag.toString())
    setBankAccount(record.bank_account || "")
    setNotes(record.notes || "")
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/sales?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        })
        fetchSalesRecords()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete record",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    const headers = ["Date", "Coffee Type", "B&L Batch No", "Estate", "Bags Sent", "KGs", "Bags Sold", "Price/Bag", "Revenue", "Bank Account", "Notes"]
    const rows = salesRecords.map((record) => [
      format(new Date(record.sale_date), "yyyy-MM-dd"),
      record.coffee_type || "",
      record.batch_no || "",
      record.estate || "",
      record.bags_sent.toString(),
      record.kgs.toString(),
      record.bags_sold.toString(),
      record.price_per_bag.toString(),
      record.revenue.toString(),
      record.bank_account || "",
      record.notes || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales_records_${selectedFiscalYear.label.replace("/", "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = calculateTotals()
  const soldTotals = calculateSoldTotals()
  const available = calculateAvailable()
  const avgPricePerBag = totals.totalBagsSold > 0 ? totals.totalRevenue / totals.totalBagsSold : 0

return (
    <div className="space-y-6">
      {/* Fiscal Year Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Coffee Sales</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="fiscal-year" className="text-sm text-muted-foreground">
            Fiscal Year:
          </Label>
          <Select
            value={selectedFiscalYear.label}
            onValueChange={(value) => {
              const fy = availableFiscalYears.find((y) => y.label === value)
              if (fy) setSelectedFiscalYear(fy)
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFiscalYears.map((fy) => (
                <SelectItem key={fy.label} value={fy.label}>
                  FY {fy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Available for Sale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Available for Sale</CardTitle>
          <CardDescription>Dispatched coffee available to sell (in KGs)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arabica */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800">Arabica</div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-green-600">
                  {available.arabica.toFixed(2)} KGs
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {(available.arabica / 50).toFixed(2)} Bags
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-300 text-xs text-green-700">
                <div>Dispatched: {dispatchTotals.arabica.toFixed(2)} KGs ({(dispatchTotals.arabica / 50).toFixed(2)} bags)</div>
                <div>Sold: {soldTotals.arabica.toFixed(2)} KGs ({(soldTotals.arabica / 50).toFixed(2)} bags)</div>
              </div>
            </div>

            {/* Robusta */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm font-medium text-amber-800">Robusta</div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-amber-600">
                  {available.robusta.toFixed(2)} KGs
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  {(available.robusta / 50).toFixed(2)} Bags
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-300 text-xs text-amber-700">
                <div>Dispatched: {dispatchTotals.robusta.toFixed(2)} KGs ({(dispatchTotals.robusta / 50).toFixed(2)} bags)</div>
                <div>Sold: {soldTotals.robusta.toFixed(2)} KGs ({(soldTotals.robusta / 50).toFixed(2)} bags)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="border-2 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totals.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {salesRecords.length} sales recorded
            </div>
            <div className="text-sm font-medium mt-1 text-blue-600">
              Avg Price/Bag: ₹{avgPricePerBag.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Total Bags Sent */}
        <Card className="border-2 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bags Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalBagsSent}</div>
            <div className="text-sm text-muted-foreground mt-1">
              KGs: {totals.totalKgs.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Total Bags Sold */}
        <Card className="border-2 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bags Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalBagsSold.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Received at buyer
            </div>
          </CardContent>
        </Card>

        {/* Avg Price per Bag */}
        <Card className="border-2 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Price per Bag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{avgPricePerBag.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Revenue / Bags Sold
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Sale Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            {editingRecord ? "Edit Sale" : "Record Sale"}
          </CardTitle>
          <CardDescription>
            {editingRecord ? "Update the sales record" : "Record coffee sales with bags and price per bag"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal bg-transparent", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Coffee Type */}
            <div className="space-y-2">
              <Label>Coffee Type</Label>
              <Select value={coffeeType} onValueChange={setCoffeeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COFFEE_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* B&L Batch No */}
            <div className="space-y-2">
              <Label>B&L Batch No</Label>
              <Input
                type="text"
                placeholder="e.g., hfa, hfb, hfc, mv"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
              />
            </div>

            {/* Estate */}
            <div className="space-y-2">
              <Label>Estate</Label>
              <Select value={estate} onValueChange={setEstate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTATES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bags Sent */}
            <div className="space-y-2">
              <Label>Bags Sent</Label>
              <Input
                type="number"
                step="1"
                min="1"
                placeholder="Number of bags"
                value={bagsSent}
                onChange={(e) => setBagsSent(e.target.value)}
              />
            </div>

            {/* KGs (Auto-calculated) */}
            <div className="space-y-2">
              <Label>KGs (Bags x 50)</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <span className="font-medium">{kgs.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Auto-calculated</p>
            </div>

            {/* Bags Sold */}
            <div className="space-y-2">
              <Label>Bags Sold</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="kgs/50"
                value={bagsSold}
                onChange={(e) => setBagsSold(e.target.value)}
              />
            </div>

            {/* Price per Bag */}
            <div className="space-y-2">
              <Label>Price per Bag (Rs)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter price per bag"
                value={pricePerBag}
                onChange={(e) => setPricePerBag(e.target.value)}
              />
            </div>

            {/* Revenue (Auto-calculated) */}
            <div className="space-y-2">
              <Label>Revenue (Calculated)</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium text-green-600">₹{calculatedRevenue.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Bags Sold x Price/Bag</p>
            </div>

            {/* Bank Account */}
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Input
                type="text"
                placeholder="e.g., H3xl3"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                type="text"
                placeholder="Any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {editingRecord && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="bg-green-700 hover:bg-green-800">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingRecord ? "Update Sale" : "Save Sale"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Records
              </CardTitle>
              <CardDescription>History of all coffee sales</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : salesRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sales records found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Coffee Type</TableHead>
                    <TableHead>B&L Batch No</TableHead>
                    <TableHead>Estate</TableHead>
                    <TableHead className="text-right">Bags Sent</TableHead>
                    <TableHead className="text-right">KGs</TableHead>
                    <TableHead className="text-right">Bags Sold</TableHead>
                    <TableHead className="text-right">Price/Bag</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.sale_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{record.coffee_type || "-"}</TableCell>
                      <TableCell>{record.batch_no || "-"}</TableCell>
                      <TableCell>{record.estate || "-"}</TableCell>
                      <TableCell className="text-right">{Number(record.bags_sent)}</TableCell>
                      <TableCell className="text-right">{Number(record.kgs).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(record.bags_sold).toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{Number(record.price_per_bag).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ₹{Number(record.revenue).toLocaleString()}
                      </TableCell>
                      <TableCell>{record.bank_account || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{record.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
