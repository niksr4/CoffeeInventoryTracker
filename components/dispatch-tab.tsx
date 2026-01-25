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
import { CalendarIcon, Loader2, Save, Trash2, Download, Package, Truck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentFiscalYear, getAvailableFiscalYears, getFiscalYearDateRange, type FiscalYear } from "@/lib/fiscal-year-utils"

interface DispatchRecord {
  id?: number
  dispatch_date: string
  estate: string
  coffee_type: string
  bag_type: string
  bags_dispatched: number
  price_per_bag: number | null
  buyer_name: string | null
  notes: string | null
  created_by: string
}

interface BagTotals {
  arabica_dry_p_bags: number
  arabica_dry_cherry_bags: number
  robusta_dry_p_bags: number
  robusta_dry_cherry_bags: number
}

interface DispatchTabProps {
  isAdmin: boolean
}

const ESTATES = ["HF A", "HF B", "HF C", "MV"]
const COFFEE_TYPES = ["Arabica", "Robusta"]
const BAG_TYPES = ["Dry P", "Dry Cherry"]

export default function DispatchTab({ isAdmin }: DispatchTabProps) {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear>(getCurrentFiscalYear())
  const availableFiscalYears = getAvailableFiscalYears()
  
  const [date, setDate] = useState<Date>(new Date())
  const [estate, setEstate] = useState<string>("HF A")
  const [coffeeType, setCoffeeType] = useState<string>("Arabica")
  const [bagType, setBagType] = useState<string>("Dry P")
  const [bagsDispatched, setBagsDispatched] = useState<string>("")
  const [pricePerBag, setPricePerBag] = useState<string>("")
  const [buyerName, setBuyerName] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  
  const [bagTotals, setBagTotals] = useState<BagTotals>({
    arabica_dry_p_bags: 0,
    arabica_dry_cherry_bags: 0,
    robusta_dry_p_bags: 0,
    robusta_dry_cherry_bags: 0,
  })
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Calculate dispatched totals from records
  const calculateDispatchedTotals = useCallback(() => {
    const totals = {
      arabica_dry_p: 0,
      arabica_dry_cherry: 0,
      robusta_dry_p: 0,
      robusta_dry_cherry: 0,
    }

    dispatchRecords.forEach((record) => {
      const key = `${record.coffee_type.toLowerCase()}_${record.bag_type.toLowerCase().replace(" ", "_")}` as keyof typeof totals
      if (totals[key] !== undefined) {
        totals[key] += Number(record.bags_dispatched)
      }
    })

    return totals
  }, [dispatchRecords])

  // Fetch bag totals from processing data - need to fetch each location separately
  const fetchBagTotals = useCallback(async () => {
    try {
      const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
      const locations = ["HF Arabica", "HF Robusta", "MV Robusta", "PG Robusta"]
      
      const locationTotals: Record<string, { dryPBags: number; dryCherryBags: number }> = {}

      // Fetch data for each location
      await Promise.all(
        locations.map(async (location) => {
          const response = await fetch(
            `/api/processing-records?location=${encodeURIComponent(location)}&fiscalYearStart=${startDate}&fiscalYearEnd=${endDate}`
          )
          const data = await response.json()

          console.log("[v0] Location:", location, "Records count:", data.records?.length, "First record date:", data.records?.[0]?.process_date)
          console.log("[v0] First record dry_p_bags_todate:", data.records?.[0]?.dry_p_bags_todate, "dry_cherry_bags_todate:", data.records?.[0]?.dry_cherry_bags_todate)

          if (data.success && data.records && data.records.length > 0) {
            // First record is the most recent (ordered by process_date DESC)
            const latestRecord = data.records[0]
            locationTotals[location] = {
              dryPBags: Number(latestRecord.dry_p_bags_todate) || 0,
              dryCherryBags: Number(latestRecord.dry_cherry_bags_todate) || 0,
            }
          }
        })
      )

      console.log("[v0] Final locationTotals:", locationTotals)

      // Calculate Arabica totals (only HF Arabica)
      const arabicaDryP = locationTotals["HF Arabica"]?.dryPBags || 0
      const arabicaDryCherry = locationTotals["HF Arabica"]?.dryCherryBags || 0

      // Calculate Robusta totals (HF Robusta + MV Robusta + PG Robusta)
      const robustaDryP = 
        (locationTotals["HF Robusta"]?.dryPBags || 0) +
        (locationTotals["MV Robusta"]?.dryPBags || 0) +
        (locationTotals["PG Robusta"]?.dryPBags || 0)
      const robustaDryCherry = 
        (locationTotals["HF Robusta"]?.dryCherryBags || 0) +
        (locationTotals["MV Robusta"]?.dryCherryBags || 0) +
        (locationTotals["PG Robusta"]?.dryCherryBags || 0)

      setBagTotals({
        arabica_dry_p_bags: arabicaDryP,
        arabica_dry_cherry_bags: arabicaDryCherry,
        robusta_dry_p_bags: robustaDryP,
        robusta_dry_cherry_bags: robustaDryCherry,
      })
    } catch (error) {
      console.error("Error fetching bag totals:", error)
    }
  }, [selectedFiscalYear])

  // Fetch dispatch records
  const fetchDispatchRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
      const response = await fetch(`/api/dispatch?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()

      if (data.success) {
        setDispatchRecords(data.records || [])
      } else {
        console.error("Error fetching dispatch records:", data.error)
      }
    } catch (error) {
      console.error("Error fetching dispatch records:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedFiscalYear])

  useEffect(() => {
    fetchBagTotals()
    fetchDispatchRecords()
  }, [fetchBagTotals, fetchDispatchRecords])

  const handleSave = async () => {
    if (!bagsDispatched || Number(bagsDispatched) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of bags",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatch_date: format(date, "yyyy-MM-dd"),
          estate,
          coffee_type: coffeeType,
          bag_type: bagType,
          bags_dispatched: Number(bagsDispatched),
          price_per_bag: isAdmin && pricePerBag ? Number(pricePerBag) : null,
          buyer_name: isAdmin && buyerName ? buyerName : null,
          notes: notes || null,
          created_by: isAdmin ? "admin" : "KAB",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Dispatch record saved successfully",
        })
        // Reset form
        setBagsDispatched("")
        setPricePerBag("")
        setBuyerName("")
        setNotes("")
        // Refresh records
        fetchDispatchRecords()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save dispatch record",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dispatch record",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/dispatch?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        })
        fetchDispatchRecords()
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

  const handleUpdatePrice = async (id: number, price: string, buyer: string) => {
    try {
      const response = await fetch("/api/dispatch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          price_per_bag: price ? Number(price) : null,
          buyer_name: buyer || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Record updated successfully",
        })
        fetchDispatchRecords()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    const headers = ["Date", "Estate", "Coffee Type", "Bag Type", "Bags Dispatched", "Price/Bag", "Buyer", "Notes"]
    const rows = dispatchRecords.map((record) => [
      format(new Date(record.dispatch_date), "yyyy-MM-dd"),
      record.estate,
      record.coffee_type,
      record.bag_type,
      record.bags_dispatched.toString(),
      record.price_per_bag?.toString() || "",
      record.buyer_name || "",
      record.notes || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dispatch_records_${selectedFiscalYear.label.replace("/", "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dispatchedTotals = calculateDispatchedTotals()

  // Calculate balance
  const balanceArabicaDryP = bagTotals.arabica_dry_p_bags - dispatchedTotals.arabica_dry_p
  const balanceArabicaDryCherry = bagTotals.arabica_dry_cherry_bags - dispatchedTotals.arabica_dry_cherry
  const balanceRobustaDryP = bagTotals.robusta_dry_p_bags - dispatchedTotals.robusta_dry_p
  const balanceRobustaDryCherry = bagTotals.robusta_dry_cherry_bags - dispatchedTotals.robusta_dry_cherry

  return (
    <div className="space-y-6">
      {/* Fiscal Year Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Coffee Bag Dispatch</h2>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Arabica Dry P */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arabica Dry P Bags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagTotals.arabica_dry_p_bags.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispatched: {dispatchedTotals.arabica_dry_p.toFixed(2)}
            </div>
            <div className={cn("text-sm font-medium mt-1", balanceArabicaDryP < 0 ? "text-red-600" : "text-green-600")}>
              Balance: {balanceArabicaDryP.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Arabica Dry Cherry */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arabica Dry Cherry Bags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagTotals.arabica_dry_cherry_bags.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispatched: {dispatchedTotals.arabica_dry_cherry.toFixed(2)}
            </div>
            <div className={cn("text-sm font-medium mt-1", balanceArabicaDryCherry < 0 ? "text-red-600" : "text-green-600")}>
              Balance: {balanceArabicaDryCherry.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Robusta Dry P */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Robusta Dry P Bags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagTotals.robusta_dry_p_bags.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispatched: {dispatchedTotals.robusta_dry_p.toFixed(2)}
            </div>
            <div className={cn("text-sm font-medium mt-1", balanceRobustaDryP < 0 ? "text-red-600" : "text-green-600")}>
              Balance: {balanceRobustaDryP.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Robusta Dry Cherry */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Robusta Dry Cherry Bags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagTotals.robusta_dry_cherry_bags.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispatched: {dispatchedTotals.robusta_dry_cherry.toFixed(2)}
            </div>
            <div className={cn("text-sm font-medium mt-1", balanceRobustaDryCherry < 0 ? "text-red-600" : "text-green-600")}>
              Balance: {balanceRobustaDryCherry.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Dispatch Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Record Dispatch
          </CardTitle>
          <CardDescription>Record coffee bags sent out from the estate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Bags Dispatched */}
            <div className="space-y-2">
              <Label>Bags Dispatched</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter number of bags"
                value={bagsDispatched}
                onChange={(e) => setBagsDispatched(e.target.value)}
              />
            </div>

            {/* Price per Bag - Admin only */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Price per Bag (Rs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={pricePerBag}
                  onChange={(e) => setPricePerBag(e.target.value)}
                />
              </div>
            )}

            {/* Buyer Name - Admin only */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Buyer Name</Label>
                <Input
                  type="text"
                  placeholder="Enter buyer name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px]"
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
                  Save Dispatch
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Dispatch Records
              </CardTitle>
              <CardDescription>History of all dispatched bags</CardDescription>
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
          ) : dispatchRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No dispatch records found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Estate</TableHead>
                    <TableHead>Coffee Type</TableHead>
                    <TableHead>Bag Type</TableHead>
                    <TableHead className="text-right">Bags</TableHead>
                    {isAdmin && <TableHead className="text-right">Price/Bag</TableHead>}
                    {isAdmin && <TableHead>Buyer</TableHead>}
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.dispatch_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{record.estate}</TableCell>
                      <TableCell>{record.coffee_type}</TableCell>
                      <TableCell>{record.bag_type}</TableCell>
                      <TableCell className="text-right">{Number(record.bags_dispatched).toFixed(2)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {record.price_per_bag ? `₹${Number(record.price_per_bag).toFixed(2)}` : "-"}
                        </TableCell>
                      )}
                      {isAdmin && <TableCell>{record.buyer_name || "-"}</TableCell>}
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
