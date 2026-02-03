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
  bag_type: string
  batch_no: string
  estate: string
  bags_sent: number
  kgs: number
  kgs_received: number
  bags_sold: number
  price_per_bag: number
  revenue: number
  bank_account: string | null
  notes: string | null
}

interface DispatchTotals {
  arabica_cherry: number
  arabica_parchment: number
  arabica_total: number
  robusta_cherry: number
  robusta_parchment: number
  robusta_total: number
}

const COFFEE_TYPES = ["Arabica", "Robusta"]
const BAG_TYPES = ["Dry Cherry", "Dry Parchment"]
const ESTATES = ["HF A", "HF B", "HF C", "MV"]
const BATCH_NOS = ["hfa", "hfb", "hfc", "mv"]

export default function SalesTab() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear>(getCurrentFiscalYear())
  const availableFiscalYears = getAvailableFiscalYears()
  
  const [date, setDate] = useState<Date>(new Date())
  const [coffeeType, setCoffeeType] = useState<string>("Arabica")
  const [bagType, setBagType] = useState<string>("Dry Parchment")
  const [batchNo, setBatchNo] = useState<string>("")
  const [estate, setEstate] = useState<string>("HF A")
  const [bagsSent, setBagsSent] = useState<string>("")
  const [kgsReceived, setKgsReceived] = useState<string>("")
  const [pricePerBag, setPricePerBag] = useState<string>("")
  const [bankAccount, setBankAccount] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  
  // Auto-calculate kgs as bags sent x 50
  const kgs = bagsSent ? Number(bagsSent) * 50 : 0
  // Auto-calculate bags sold as kgs received / 50
  const bagsSold = kgsReceived ? Number(kgsReceived) / 50 : 0
  // Auto-calculate revenue as bags sold x price per bag
  const calculatedRevenue = bagsSold && pricePerBag ? Number(bagsSold) * Number(pricePerBag) : 0
  
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([])
  const [dispatchTotals, setDispatchTotals] = useState<DispatchTotals>({ 
    arabica_cherry: 0, 
    arabica_parchment: 0, 
    arabica_total: 0,
    robusta_cherry: 0, 
    robusta_parchment: 0,
    robusta_total: 0
  })
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Calculate sold amounts by coffee type and bag type
  const calculateSoldTotals = useCallback(() => {
    const sold = { 
      arabica_cherry: 0, 
      arabica_parchment: 0, 
      arabica_total: 0,
      robusta_cherry: 0, 
      robusta_parchment: 0,
      robusta_total: 0
    }
    
    salesRecords.forEach((record) => {
      const kgsSold = Number(record.bags_sold) * 50 // Convert bags to KGs
      
      if (record.coffee_type === "Arabica") {
        sold.arabica_total += kgsSold
        if (record.bag_type === "Dry Cherry") {
          sold.arabica_cherry += kgsSold
        } else if (record.bag_type === "Dry Parchment" || record.bag_type === "Dry P") {
          sold.arabica_parchment += kgsSold
        }
      } else if (record.coffee_type === "Robusta") {
        sold.robusta_total += kgsSold
        if (record.bag_type === "Dry Cherry") {
          sold.robusta_cherry += kgsSold
        } else if (record.bag_type === "Dry Parchment" || record.bag_type === "Dry P") {
          sold.robusta_parchment += kgsSold
        }
      }
    })
    
    return sold
  }, [salesRecords])

  // Calculate available inventory (dispatched - sold)
  const calculateAvailable = useCallback(() => {
    const sold = calculateSoldTotals()
    return {
      arabica_cherry: Math.max(0, dispatchTotals.arabica_cherry - sold.arabica_cherry),
      arabica_parchment: Math.max(0, dispatchTotals.arabica_parchment - sold.arabica_parchment),
      arabica_total: Math.max(0, dispatchTotals.arabica_total - sold.arabica_total),
      robusta_cherry: Math.max(0, dispatchTotals.robusta_cherry - sold.robusta_cherry),
      robusta_parchment: Math.max(0, dispatchTotals.robusta_parchment - sold.robusta_parchment),
      robusta_total: Math.max(0, dispatchTotals.robusta_total - sold.robusta_total),
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
        const totals = { 
          arabica_cherry: 0, 
          arabica_parchment: 0, 
          arabica_total: 0,
          robusta_cherry: 0, 
          robusta_parchment: 0,
          robusta_total: 0
        }

        data.records.forEach((record: { coffee_type: string; bag_type: string; bags_dispatched: number }) => {
          const kgs = Number(record.bags_dispatched) * 50 // Convert bags to KGs
          
          if (record.coffee_type === "Arabica") {
            totals.arabica_total += kgs
            if (record.bag_type === "Dry Cherry") {
              totals.arabica_cherry += kgs
            } else if (record.bag_type === "Dry Parchment" || record.bag_type === "Dry P") {
              totals.arabica_parchment += kgs
            }
          } else if (record.coffee_type === "Robusta") {
            totals.robusta_total += kgs
            if (record.bag_type === "Dry Cherry") {
              totals.robusta_cherry += kgs
            } else if (record.bag_type === "Dry Parchment" || record.bag_type === "Dry P") {
              totals.robusta_parchment += kgs
            }
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
    console.log("[v0] handleSave called with:", {
      bagsSent,
      kgsReceived,
      pricePerBag,
      kgs,
      bagsSold,
      calculatedRevenue,
      coffeeType,
      bagType,
      estate
    })

    if (!bagsSent || Number(bagsSent) <= 0) {
      console.log("[v0] Validation failed: bagsSent", bagsSent)
      toast({
        title: "Error",
        description: "Please enter the number of bags sent",
        variant: "destructive",
      })
      return
    }

    if (!kgsReceived || Number(kgsReceived) <= 0) {
      console.log("[v0] Validation failed: kgsReceived", kgsReceived)
      toast({
        title: "Error",
        description: "Please enter the KGs received",
        variant: "destructive",
      })
      return
    }

    if (!pricePerBag || Number(pricePerBag) <= 0) {
      console.log("[v0] Validation failed: pricePerBag", pricePerBag)
      toast({
        title: "Error",
        description: "Please enter a valid price per bag",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] All validations passed, proceeding to save")
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
          bag_type: bagType,
          batch_no: batchNo || null,
          estate: estate,
          bags_sent: Number(bagsSent),
          kgs: kgs,
          kgs_received: Number(kgsReceived),
          bags_sold: bagsSold,
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
    setBagType("Dry Parchment")
    setBatchNo("")
    setEstate("HF A")
    setBagsSent("")
    setKgsReceived("")
    setPricePerBag("")
    setBankAccount("")
    setNotes("")
    setEditingRecord(null)
  }

  const handleEdit = (record: SalesRecord) => {
    setEditingRecord(record)
    setDate(new Date(record.sale_date))
    setCoffeeType(record.coffee_type || "Arabica")
    setBagType(record.bag_type || "Dry Parchment")
    setBatchNo(record.batch_no || "")
    setEstate(record.estate || "HF A")
    setBagsSent(record.bags_sent.toString())
    setKgsReceived(record.kgs_received?.toString() || "")
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
    const headers = ["Date", "Coffee Type", "Bag Type", "B&L Batch No", "Estate", "Bags Sent", "KGs", "KGs Received", "Bags Sold", "Price/Bag", "Revenue", "Bank Account", "Notes"]
    
    const formatRow = (record: SalesRecord) => [
      format(new Date(record.sale_date), "yyyy-MM-dd"),
      record.coffee_type || "",
      record.bag_type || "",
      record.batch_no || "",
      record.estate || "",
      record.bags_sent.toString(),
      record.kgs.toString(),
      record.kgs_received?.toString() || "0",
      record.bags_sold.toString(),
      record.price_per_bag.toString(),
      record.revenue.toString(),
      record.bank_account || "",
      record.notes || "",
    ]

    // Helper to create a category code (e.g., "AP" = Arabica + Dry Parchment)
    const getCategoryCode = (record: SalesRecord) => {
      const typeCode = record.coffee_type === "Arabica" ? "A" : "R"
      const bagCode = record.bag_type === "Dry Parchment" ? "P" : "C"
      return typeCode + bagCode
    }

    let csvContent = ""

    // Section 1: Sorted by Date
    csvContent += "SORTED BY DATE\n"
    csvContent += headers.join(",") + "\n"
    const sortedByDate = [...salesRecords].sort((a, b) => 
      new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
    )
    sortedByDate.forEach((record) => {
      csvContent += formatRow(record).map((cell) => `"${cell}"`).join(",") + "\n"
    })

    csvContent += "\n\n"

    // Section 2: Categorized by Type (AP, AC, RP, RC)
    csvContent += "CATEGORIZED BY TYPE\n"
    const categories = ["AP", "AC", "RP", "RC"]
    const categoryNames: Record<string, string> = {
      "AP": "Arabica Dry Parchment",
      "AC": "Arabica Dry Cherry",
      "RP": "Robusta Dry Parchment",
      "RC": "Robusta Dry Cherry"
    }

    categories.forEach((category) => {
      const filtered = salesRecords.filter(r => getCategoryCode(r) === category)
      if (filtered.length > 0) {
        csvContent += `\n${categoryNames[category]}\n`
        csvContent += headers.join(",") + "\n"
        filtered.forEach((record) => {
          csvContent += formatRow(record).map((cell) => `"${cell}"`).join(",") + "\n"
        })
      }
    })

    csvContent += "\n\n"

    // Section 3: Categorized by Estate
    csvContent += "CATEGORIZED BY ESTATE\n"
    const estates = Array.from(new Set(salesRecords.map(r => r.estate))).sort()
    
    estates.forEach((estateName) => {
      const filtered = salesRecords.filter(r => r.estate === estateName)
      if (filtered.length > 0) {
        csvContent += `\n${estateName}\n`
        csvContent += headers.join(",") + "\n"
        filtered.forEach((record) => {
          csvContent += formatRow(record).map((cell) => `"${cell}"`).join(",") + "\n"
        })
      }
    })

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Arabica Section */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-green-800 mb-2">Arabica</div>
              
              {/* Arabica Cherry */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-xs font-medium text-green-700">Cherry</div>
                <div className="text-lg font-bold text-green-600 mt-1">
                  {available.arabica_cherry.toFixed(2)} KGs
                </div>
                <div className="text-xs text-green-600">
                  {(available.arabica_cherry / 50).toFixed(2)} Bags
                </div>
              </div>

              {/* Arabica Parchment */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-xs font-medium text-green-700">Parchment</div>
                <div className="text-lg font-bold text-green-600 mt-1">
                  {available.arabica_parchment.toFixed(2)} KGs
                </div>
                <div className="text-xs text-green-600">
                  {(available.arabica_parchment / 50).toFixed(2)} Bags
                </div>
              </div>

              {/* Arabica Total */}
              <div className="p-3 bg-green-100 border-2 border-green-400 rounded-md">
                <div className="text-xs font-bold text-green-800">Total Arabica</div>
                <div className="text-xl font-bold text-green-700 mt-1">
                  {available.arabica_total.toFixed(2)} KGs
                </div>
                <div className="text-xs text-green-700">
                  {(available.arabica_total / 50).toFixed(2)} Bags
                </div>
              </div>
            </div>

            {/* Robusta Section */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-amber-800 mb-2">Robusta</div>
              
              {/* Robusta Cherry */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="text-xs font-medium text-amber-700">Cherry</div>
                <div className="text-lg font-bold text-amber-600 mt-1">
                  {available.robusta_cherry.toFixed(2)} KGs
                </div>
                <div className="text-xs text-amber-600">
                  {(available.robusta_cherry / 50).toFixed(2)} Bags
                </div>
              </div>

              {/* Robusta Parchment */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="text-xs font-medium text-amber-700">Parchment</div>
                <div className="text-lg font-bold text-amber-600 mt-1">
                  {available.robusta_parchment.toFixed(2)} KGs
                </div>
                <div className="text-xs text-amber-600">
                  {(available.robusta_parchment / 50).toFixed(2)} Bags
                </div>
              </div>

              {/* Robusta Total */}
              <div className="p-3 bg-amber-100 border-2 border-amber-400 rounded-md">
                <div className="text-xs font-bold text-amber-800">Total Robusta</div>
                <div className="text-xl font-bold text-amber-700 mt-1">
                  {available.robusta_total.toFixed(2)} KGs
                </div>
                <div className="text-xs text-amber-700">
                  {(available.robusta_total / 50).toFixed(2)} Bags
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-800 mb-2">Summary</div>
              
              {/* Dispatched Total */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs font-medium text-blue-700">Total Dispatched</div>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  {(dispatchTotals.arabica_total + dispatchTotals.robusta_total).toFixed(2)} KGs
                </div>
                <div className="text-xs text-blue-600">
                  {((dispatchTotals.arabica_total + dispatchTotals.robusta_total) / 50).toFixed(2)} Bags
                </div>
              </div>

              {/* Sold Total */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <div className="text-xs font-medium text-purple-700">Total Sold</div>
                <div className="text-lg font-bold text-purple-600 mt-1">
                  {(soldTotals.arabica_total + soldTotals.robusta_total).toFixed(2)} KGs
                </div>
                <div className="text-xs text-purple-600">
                  {((soldTotals.arabica_total + soldTotals.robusta_total) / 50).toFixed(2)} Bags
                </div>
              </div>

              {/* Available Total */}
              <div className="p-3 bg-slate-100 border-2 border-slate-400 rounded-md">
                <div className="text-xs font-bold text-slate-800">Total Available</div>
                <div className="text-xl font-bold text-slate-700 mt-1">
                  {(available.arabica_total + available.robusta_total).toFixed(2)} KGs
                </div>
                <div className="text-xs text-slate-700">
                  {((available.arabica_total + available.robusta_total) / 50).toFixed(2)} Bags
                </div>
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

            {/* Bag Type */}
            <div className="space-y-2">
              <Label>Bag Type</Label>
              <Select value={bagType} onValueChange={setBagType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAG_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
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

            {/* KGs Received */}
            <div className="space-y-2">
              <Label>KGs Received</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter KGs received"
                value={kgsReceived}
                onChange={(e) => setKgsReceived(e.target.value)}
              />
            </div>

            {/* Bags Sold (Auto-calculated) */}
            <div className="space-y-2">
              <Label>Bags Sold (KGs / 50)</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <span className="font-medium">{bagsSold.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Auto-calculated</p>
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
                    <TableHead>Bag Type</TableHead>
                    <TableHead>B&L Batch No</TableHead>
                    <TableHead>Estate</TableHead>
                    <TableHead className="text-right">Bags Sent</TableHead>
                    <TableHead className="text-right">KGs</TableHead>
                    <TableHead className="text-right">KGs Received</TableHead>
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
                      <TableCell>{record.bag_type || "-"}</TableCell>
                      <TableCell>{record.batch_no || "-"}</TableCell>
                      <TableCell>{record.estate || "-"}</TableCell>
                      <TableCell className="text-right">{Number(record.bags_sent)}</TableCell>
                      <TableCell className="text-right">{Number(record.kgs).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(record.kgs_received || 0).toFixed(2)}</TableCell>
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
