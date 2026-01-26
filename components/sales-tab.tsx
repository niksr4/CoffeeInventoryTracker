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
import { CalendarIcon, Loader2, Save, Trash2, Download, IndianRupee, TrendingUp } from "lucide-react"
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
  bags_sent: number
  kgs_sent: number
  kgs_received: number
  price_per_kg: number
  total_revenue: number
  buyer_name: string | null
  notes: string | null
}

interface DispatchedTotals {
  arabica_dry_p: number
  arabica_dry_cherry: number
  robusta_dry_p: number
  robusta_dry_cherry: number
}

const COFFEE_TYPES = ["Arabica", "Robusta"]
const BAG_TYPES = ["Dry P", "Dry Cherry"]

export default function SalesTab() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear>(getCurrentFiscalYear())
  const availableFiscalYears = getAvailableFiscalYears()
  
  const [date, setDate] = useState<Date>(new Date())
  const [coffeeType, setCoffeeType] = useState<string>("Arabica")
  const [bagType, setBagType] = useState<string>("Dry P")
  const [bagsSent, setBagsSent] = useState<string>("")
  const [kgsReceived, setKgsReceived] = useState<string>("")
  const [pricePerKg, setPricePerKg] = useState<string>("")
  const [buyerName, setBuyerName] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  
  // Auto-calculate kgs sent as bags x 50
  const kgsSent = bagsSent ? Number(bagsSent) * 50 : 0
  
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([])
  const [dispatchedTotals, setDispatchedTotals] = useState<DispatchedTotals>({
    arabica_dry_p: 0,
    arabica_dry_cherry: 0,
    robusta_dry_p: 0,
    robusta_dry_cherry: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [needsMigration, setNeedsMigration] = useState(false)
  const { toast } = useToast()

  // Calculate sold totals from sales records (using kgs_received as the actual sold amount)
  const calculateSoldTotals = useCallback(() => {
    const totals = {
      arabica_dry_p: 0,
      arabica_dry_cherry: 0,
      robusta_dry_p: 0,
      robusta_dry_cherry: 0,
    }

    salesRecords.forEach((record) => {
      const key = `${record.coffee_type.toLowerCase()}_${record.bag_type.toLowerCase().replace(" ", "_")}` as keyof typeof totals
      if (totals[key] !== undefined) {
        totals[key] += Number(record.kgs_received)
      }
    })

    return totals
  }, [salesRecords])

  // Calculate available to sell (dispatched - sold)
  const getAvailableToSell = useCallback(() => {
    const sold = calculateSoldTotals()
    return {
      arabica_dry_p: Math.max(0, dispatchedTotals.arabica_dry_p - sold.arabica_dry_p),
      arabica_dry_cherry: Math.max(0, dispatchedTotals.arabica_dry_cherry - sold.arabica_dry_cherry),
      robusta_dry_p: Math.max(0, dispatchedTotals.robusta_dry_p - sold.robusta_dry_p),
      robusta_dry_cherry: Math.max(0, dispatchedTotals.robusta_dry_cherry - sold.robusta_dry_cherry),
    }
  }, [dispatchedTotals, calculateSoldTotals])

  // Fetch dispatched totals from dispatch records
  const fetchDispatchedTotals = useCallback(async () => {
    try {
      const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
      const response = await fetch(`/api/dispatch?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()

      if (data.success && data.records) {
        const totals = {
          arabica_dry_p: 0,
          arabica_dry_cherry: 0,
          robusta_dry_p: 0,
          robusta_dry_cherry: 0,
        }

        data.records.forEach((record: { coffee_type: string; bag_type: string; bags_dispatched: number }) => {
          const key = `${record.coffee_type.toLowerCase()}_${record.bag_type.toLowerCase().replace(" ", "_")}` as keyof typeof totals
          if (totals[key] !== undefined) {
            totals[key] += Number(record.bags_dispatched)
          }
        })

        setDispatchedTotals(totals)
      }
    } catch (error) {
      console.error("Error fetching dispatched totals:", error)
    }
  }, [selectedFiscalYear])

  // Calculate revenue totals
  const calculateTotals = useCallback(() => {
    const totals = {
      totalBagsSent: 0,
      totalKgsSent: 0,
      totalKgsReceived: 0,
      totalRevenue: 0,
      arabicaRevenue: 0,
      robustaRevenue: 0,
    }

    salesRecords.forEach((record) => {
      totals.totalBagsSent += Number(record.bags_sent)
      totals.totalKgsSent += Number(record.kgs_sent)
      totals.totalKgsReceived += Number(record.kgs_received)
      totals.totalRevenue += Number(record.total_revenue)
      if (record.coffee_type === "Arabica") {
        totals.arabicaRevenue += Number(record.total_revenue)
      } else {
        totals.robustaRevenue += Number(record.total_revenue)
      }
    })

    return totals
  }, [salesRecords])

  // Fetch sales records
const fetchSalesRecords = useCallback(async () => {
  setIsLoading(true)
  try {
  const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
  const response = await fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`)
  const data = await response.json()
  
  if (data.success) {
    setSalesRecords(data.records || [])
    // Check if migration is needed (records exist but new columns are missing/zero)
    if (data.records && data.records.length > 0) {
      const firstRecord = data.records[0]
      if (firstRecord.bags_sent === undefined || firstRecord.kgs_received === undefined) {
        setNeedsMigration(true)
      } else {
        setNeedsMigration(false)
      }
    }
  } else {
    // Check if error is about missing columns
    if (data.error && data.error.includes('column')) {
      setNeedsMigration(true)
    }
    console.error("Error fetching sales records:", data.error)
  }
  } catch (error) {
  console.error("Error fetching sales records:", error)
  } finally {
  setIsLoading(false)
  }
  }, [selectedFiscalYear])

  const runMigration = async () => {
    setIsMigrating(true)
    try {
      const response = await fetch('/api/migrate-sales', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Migration Complete",
          description: "Database updated successfully. Refreshing data...",
        })
        setNeedsMigration(false)
        fetchSalesRecords()
      } else {
        toast({
          title: "Migration Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

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

    if (!kgsReceived || Number(kgsReceived) <= 0) {
      toast({
        title: "Error",
        description: "Please enter the kgs received",
        variant: "destructive",
      })
      return
    }

    if (!pricePerKg || Number(pricePerKg) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price per KG",
        variant: "destructive",
      })
      return
    }

    if (!buyerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter the buyer name",
        variant: "destructive",
      })
      return
    }

    // Check available inventory
    const available = getAvailableToSell()
    const key = `${coffeeType.toLowerCase()}_${bagType.toLowerCase().replace(" ", "_")}` as keyof typeof available
    const availableAmount = available[key] || 0
    
    if (Number(kgsReceived) > availableAmount) {
      toast({
        title: "Insufficient Inventory",
        description: `Only ${availableAmount.toFixed(2)} KGs of ${coffeeType} ${bagType} available for sale. You are trying to sell ${kgsReceived} KGs.`,
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_date: format(date, "yyyy-MM-dd"),
          coffee_type: coffeeType,
          bag_type: bagType,
          bags_sent: Number(bagsSent),
          kgs_sent: kgsSent,
          kgs_received: Number(kgsReceived),
          price_per_kg: Number(pricePerKg),
          buyer_name: buyerName,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Sales record saved successfully",
        })
        // Reset form
        setBagsSent("")
        setKgsReceived("")
        setPricePerKg("")
        setBuyerName("")
        setNotes("")
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
    const headers = ["Date", "Coffee Type", "Bag Type", "Bags Sent", "KGs Sent", "KGs Received", "Price/KG", "Total Revenue", "Buyer", "Notes"]
    const rows = salesRecords.map((record) => [
      format(new Date(record.sale_date), "yyyy-MM-dd"),
      record.coffee_type,
      record.bag_type,
      record.bags_sent.toString(),
      record.kgs_sent.toString(),
      record.kgs_received.toString(),
      record.price_per_kg.toString(),
      record.total_revenue.toString(),
      record.buyer_name || "",
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
  const availableToSell = getAvailableToSell()
  const calculatedRevenue = kgsReceived && pricePerKg ? (Number(kgsReceived) * Number(pricePerKg)) : 0

  // Get current selected available amount
  const currentSelectedKey = `${coffeeType.toLowerCase()}_${bagType.toLowerCase().replace(" ", "_")}` as keyof typeof availableToSell
  const currentAvailable = availableToSell[currentSelectedKey] || 0

return (
  <div className="space-y-6">
  {/* Migration Banner */}
  {needsMigration && (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
      <div>
        <h3 className="font-medium text-amber-800">Database Update Required</h3>
        <p className="text-sm text-amber-700">
          The sales table needs to be updated to support the new bags/kgs tracking fields.
        </p>
      </div>
      <Button 
        onClick={runMigration} 
        disabled={isMigrating}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        {isMigrating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Run Update"
        )}
      </Button>
    </div>
  )}

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

      {/* Inventory Summary - Dispatched vs Sold vs Available */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Available for Sale</CardTitle>
          <CardDescription>Coffee dispatched from processing that is available to sell</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Arabica Dry P */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Arabica Dry P</div>
              <div className="mt-1">
                <div className="text-lg font-bold text-green-600">{availableToSell.arabica_dry_p.toFixed(2)} KGs</div>
                <div className="text-xs text-muted-foreground">
                  Dispatched: {dispatchedTotals.arabica_dry_p.toFixed(2)} | Sold: {soldTotals.arabica_dry_p.toFixed(2)}
                </div>
              </div>
            </div>
            {/* Arabica Dry Cherry */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Arabica Dry Cherry</div>
              <div className="mt-1">
                <div className="text-lg font-bold text-green-600">{availableToSell.arabica_dry_cherry.toFixed(2)} KGs</div>
                <div className="text-xs text-muted-foreground">
                  Dispatched: {dispatchedTotals.arabica_dry_cherry.toFixed(2)} | Sold: {soldTotals.arabica_dry_cherry.toFixed(2)}
                </div>
              </div>
            </div>
            {/* Robusta Dry P */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Robusta Dry P</div>
              <div className="mt-1">
                <div className="text-lg font-bold text-amber-600">{availableToSell.robusta_dry_p.toFixed(2)} KGs</div>
                <div className="text-xs text-muted-foreground">
                  Dispatched: {dispatchedTotals.robusta_dry_p.toFixed(2)} | Sold: {soldTotals.robusta_dry_p.toFixed(2)}
                </div>
              </div>
            </div>
            {/* Robusta Dry Cherry */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Robusta Dry Cherry</div>
              <div className="mt-1">
                <div className="text-lg font-bold text-amber-600">{availableToSell.robusta_dry_cherry.toFixed(2)} KGs</div>
                <div className="text-xs text-muted-foreground">
                  Dispatched: {dispatchedTotals.robusta_dry_cherry.toFixed(2)} | Sold: {soldTotals.robusta_dry_cherry.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totals.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {salesRecords.length} sales recorded
            </div>
          </CardContent>
        </Card>

        {/* Total KGs Received */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total KGs Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalKgsReceived.toFixed(2)} KGs</div>
            <div className="text-sm text-muted-foreground mt-1">
              Bags: {totals.totalBagsSent} | Sent: {totals.totalKgsSent.toFixed(2)} KGs
            </div>
          </CardContent>
        </Card>

        {/* Arabica Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arabica Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{totals.arabicaRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {totals.totalRevenue > 0 ? ((totals.arabicaRevenue / totals.totalRevenue) * 100).toFixed(1) : 0}% of total
            </div>
          </CardContent>
        </Card>

        {/* Robusta Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Robusta Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totals.robustaRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {totals.totalRevenue > 0 ? ((totals.robustaRevenue / totals.totalRevenue) * 100).toFixed(1) : 0}% of total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Sale Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Record Sale
          </CardTitle>
          <CardDescription>Record coffee sales with weight in KGs and price</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label>Sale Date</Label>
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
              <p className={cn(
                "text-xs",
                currentAvailable > 0 ? "text-green-600" : "text-red-600"
              )}>
                Available: {currentAvailable.toFixed(2)} KGs
              </p>
            </div>

            {/* Bags Sent */}
            <div className="space-y-2">
              <Label>Number of Bags Sent</Label>
              <Input
                type="number"
                step="1"
                min="1"
                placeholder="Enter number of bags"
                value={bagsSent}
                onChange={(e) => setBagsSent(e.target.value)}
              />
            </div>

            {/* KGs Sent (Auto-calculated) */}
            <div className="space-y-2">
              <Label>KGs Sent (Bags x 50)</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <span className="font-medium">{kgsSent.toFixed(2)} KGs</span>
              </div>
              <p className="text-xs text-muted-foreground">Auto-calculated</p>
            </div>

            {/* KGs Received */}
            <div className="space-y-2">
              <Label>KGs Received</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter kgs received"
                value={kgsReceived}
                onChange={(e) => setKgsReceived(e.target.value)}
                max={currentAvailable}
              />
              {kgsReceived && Number(kgsReceived) > currentAvailable && (
                <p className="text-xs text-red-600">
                  Exceeds available inventory!
                </p>
              )}
            </div>

            {/* Price per KG */}
            <div className="space-y-2">
              <Label>Price per KG (Rs)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter price per KG"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
              />
            </div>

            {/* Buyer Name */}
            <div className="space-y-2">
              <Label>Buyer Name</Label>
              <Input
                type="text"
                placeholder="Enter buyer name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>

            {/* Calculated Revenue */}
            <div className="space-y-2">
              <Label>Total Revenue (Calculated)</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium text-green-600">₹{calculatedRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="bg-green-700 hover:bg-green-800">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Sale
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
                    <TableHead className="text-right">Bags Sent</TableHead>
                    <TableHead className="text-right">KGs Sent</TableHead>
                    <TableHead className="text-right">KGs Received</TableHead>
                    <TableHead className="text-right">Price/KG</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.sale_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{record.coffee_type}</TableCell>
                      <TableCell>{record.bag_type}</TableCell>
                      <TableCell className="text-right">{Number(record.bags_sent)}</TableCell>
                      <TableCell className="text-right">{Number(record.kgs_sent).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(record.kgs_received).toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{Number(record.price_per_kg).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ₹{Number(record.total_revenue).toLocaleString()}
                      </TableCell>
                      <TableCell>{record.buyer_name || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{record.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
