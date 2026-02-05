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
import { CalendarIcon, Loader2, Save, Trash2, Download, Package, Truck, Pencil } from "lucide-react"
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
  price_per_bag?: number
  buyer_name?: string
  notes: string | null
  created_by: string
}

interface BagTotals {
  arabica_dry_p_bags: number
  arabica_dry_cherry_bags: number
  robusta_dry_p_bags: number
  robusta_dry_cherry_bags: number
}

const ESTATES = ["HF A", "HF B", "HF C", "MV"]
const COFFEE_TYPES = ["Arabica", "Robusta"]
const BAG_TYPES = ["Dry Parchment", "Dry Cherry"]

export default function DispatchTab() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear>(getCurrentFiscalYear())
  const availableFiscalYears = getAvailableFiscalYears()
  
  const [date, setDate] = useState<Date>(new Date())
  const [estate, setEstate] = useState<string>("HF A")
  const [coffeeType, setCoffeeType] = useState<string>("Arabica")
  const [bagType, setBagType] = useState<string>("Dry Parchment")
  const [bagsDispatched, setBagsDispatched] = useState<string>("")
  const [kgsReceived, setKgsReceived] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  
  const [bagTotals, setBagTotals] = useState<BagTotals>({
    arabica_dry_p_bags: 0,
    arabica_dry_cherry_bags: 0,
    robusta_dry_p_bags: 0,
    robusta_dry_cherry_bags: 0,
  })
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<DispatchRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Calculate dispatched totals from records
  const calculateDispatchedTotals = useCallback(() => {
    const totals = {
      arabica_dry_parchment: 0,
      arabica_dry_cherry: 0,
      robusta_dry_parchment: 0,
      robusta_dry_cherry: 0,
    }

    dispatchRecords.forEach((record) => {
      const coffeeType = record.coffee_type.toLowerCase()
      const bagType = record.bag_type.toLowerCase()
      
      // Map bag types to the correct key format
      let key: keyof typeof totals | undefined
      if (coffeeType === "arabica" && bagType === "dry parchment") {
        key = "arabica_dry_parchment"
      } else if (coffeeType === "arabica" && bagType === "dry cherry") {
        key = "arabica_dry_cherry"
      } else if (coffeeType === "robusta" && bagType === "dry parchment") {
        key = "robusta_dry_parchment"
      } else if (coffeeType === "robusta" && bagType === "dry cherry") {
        key = "robusta_dry_cherry"
      }
      
      if (key) {
        totals[key] += Number(record.bags_dispatched)
      }
    })

    return totals
  }, [dispatchRecords])

  // Fetch bag totals from processing data - need to fetch each location separately
  // Calculate cumulative totals by summing all "today" values (same as processing dashboard)
  const fetchBagTotals = useCallback(async () => {
    try {
      const { startDate, endDate } = getFiscalYearDateRange(selectedFiscalYear)
      const locations = ["HF Arabica", "HF Robusta", "MV Robusta", "PG Robusta"]
      
      const locationTotals: Record<string, { dryParchmentBags: number; dryCherryBags: number }> = {}

      // Fetch data for each location
      await Promise.all(
        locations.map(async (location) => {
          const response = await fetch(
            `/api/processing-records?location=${encodeURIComponent(location)}&fiscalYearStart=${startDate}&fiscalYearEnd=${endDate}`
          )
          const data = await response.json()

          if (data.success && data.records && data.records.length > 0) {
            // Calculate cumulative totals by summing all "today" bag values from all records
            let cumulativeDryParchmentBags = 0
            let cumulativeDryCherryBags = 0
            
            for (const record of data.records) {
              cumulativeDryParchmentBags += Number(record.dry_parchment_bags) || 0
              cumulativeDryCherryBags += Number(record.dry_cherry_bags) || 0
            }
            
            locationTotals[location] = {
              dryParchmentBags: Number(cumulativeDryParchmentBags.toFixed(2)),
              dryCherryBags: Number(cumulativeDryCherryBags.toFixed(2)),
            }
          }
        })
      )

      // Calculate Arabica totals (only HF Arabica)
      const arabicaDryParchment = locationTotals["HF Arabica"]?.dryParchmentBags || 0
      const arabicaDryCherry = locationTotals["HF Arabica"]?.dryCherryBags || 0

      // Calculate Robusta totals (HF Robusta + MV Robusta + PG Robusta)
      const robustaDryParchment = 
        (locationTotals["HF Robusta"]?.dryParchmentBags || 0) +
        (locationTotals["MV Robusta"]?.dryParchmentBags || 0) +
        (locationTotals["PG Robusta"]?.dryParchmentBags || 0)
      const robustaDryCherry = 
        (locationTotals["HF Robusta"]?.dryCherryBags || 0) +
        (locationTotals["MV Robusta"]?.dryCherryBags || 0) +
        (locationTotals["PG Robusta"]?.dryCherryBags || 0)

      setBagTotals({
        arabica_dry_p_bags: arabicaDryParchment,
        arabica_dry_cherry_bags: arabicaDryCherry,
        robusta_dry_p_bags: robustaDryParchment,
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

    // Check if we have enough bags available from processing (only for new records)
    if (!editingRecord) {
      const balance = getBalanceForSelection()
      if (Number(bagsDispatched) > balance) {
        toast({
          title: "Insufficient Inventory",
          description: `Only ${balance.toFixed(2)} ${coffeeType} ${bagType} bags available from processing. You are trying to dispatch ${bagsDispatched} bags.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsSaving(true)
    try {
      const method = editingRecord ? "PUT" : "POST"
      const response = await fetch("/api/dispatch", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord?.id,
          dispatch_date: format(date, "yyyy-MM-dd"),
          estate,
          coffee_type: coffeeType,
          bag_type: bagType,
          bags_dispatched: Number(bagsDispatched),
          kgs_received: kgsReceived ? Number(kgsReceived) : null,
          bags_received: kgsReceived ? Number(kgsReceived) / 50 : null,
          notes: notes || null,
          created_by: "dispatch",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingRecord ? "Dispatch record updated successfully" : "Dispatch record saved successfully",
        })
        // Reset form
        resetForm()
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

  const resetForm = () => {
    setBagsDispatched("")
    setKgsReceived("")
    setNotes("")
    setEditingRecord(null)
  }

  const handleEdit = (record: DispatchRecord) => {
    setEditingRecord(record)
    setDate(new Date(record.dispatch_date))
    setEstate(record.estate)
    setCoffeeType(record.coffee_type)
    setBagType(record.bag_type)
    setBagsDispatched(record.bags_dispatched.toString())
    setKgsReceived(record.kgs_received?.toString() || "")
    setNotes(record.notes || "")
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

  const exportToCSV = () => {
    const headers = ["Date", "Estate", "Coffee Type", "Bag Type", "Bags Dispatched", "KGs Received", "Notes"]
    const rows = dispatchRecords.map((record) => [
      format(new Date(record.dispatch_date), "yyyy-MM-dd"),
      record.estate,
      record.coffee_type,
      record.bag_type,
      record.bags_dispatched.toString(),
      record.kgs_received?.toString() || "",
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
    const balanceArabicaDryParchment = bagTotals.arabica_dry_p_bags - dispatchedTotals.arabica_dry_parchment
    const balanceArabicaDryCherry = bagTotals.arabica_dry_cherry_bags - dispatchedTotals.arabica_dry_cherry
    const balanceRobustaDryParchment = bagTotals.robusta_dry_p_bags - dispatchedTotals.robusta_dry_parchment
    const balanceRobustaDryCherry = bagTotals.robusta_dry_cherry_bags - dispatchedTotals.robusta_dry_cherry

  // Get current selected balance
  const getBalanceForSelection = () => {
    if (coffeeType === "Arabica" && bagType === "Dry Parchment") return balanceArabicaDryP
    if (coffeeType === "Arabica" && bagType === "Dry Cherry") return balanceArabicaDryCherry
    if (coffeeType === "Robusta" && bagType === "Dry Parchment") return balanceRobustaDryP
    if (coffeeType === "Robusta" && bagType === "Dry Cherry") return balanceRobustaDryCherry
    return 0
  }
  const currentBalance = getBalanceForSelection()

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
        {/* Arabica Dry Parchment */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arabica Dry Parchment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagTotals.arabica_dry_p_bags.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispatched: {dispatchedTotals.arabica_dry_parchment.toFixed(2)}
            </div>
            <div className={`text-sm font-medium mt-1 ${balanceArabicaDryParchment < 0 ? 'text-red-500' : 'text-green-600'}`}>
              Balance: {balanceArabicaDryParchment.toFixed(2)}
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

        {/* Robusta Dry Parchment */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Robusta Dry Parchment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagTotals.robusta_dry_p_bags.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Dispatched: {dispatchedTotals.robusta_dry_parchment.toFixed(2)}
            </div>
            <div className={`text-sm font-medium mt-1 ${balanceRobustaDryParchment < 0 ? 'text-red-500' : 'text-green-600'}`}>
              Balance: {balanceRobustaDryParchment.toFixed(2)}
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
            {editingRecord ? "Edit Dispatch" : "Record Dispatch"}
          </CardTitle>
          <CardDescription>
            {editingRecord ? "Update the dispatch record" : "Record coffee bags sent out from the estate"}
          </CardDescription>
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
              <p className={cn(
                "text-xs",
                currentBalance > 0 ? "text-green-600" : "text-red-600"
              )}>
                Available: {currentBalance.toFixed(2)} bags
              </p>
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
                max={currentBalance}
              />
              {bagsDispatched && Number(bagsDispatched) > currentBalance && (
                <p className="text-xs text-red-600">
                  Exceeds available inventory from processing!
                </p>
              )}
            </div>

            {/* KGs Received */}
            <div className="space-y-2">
              <Label>KGs Received (Optional)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter KGs received (can update later)"
                value={kgsReceived}
                onChange={(e) => setKgsReceived(e.target.value)}
              />
              {kgsReceived && (
                <p className="text-xs text-muted-foreground">
                  ≈ {(Number(kgsReceived) / 50).toFixed(2)} bags
                </p>
              )}
            </div>

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
                  {editingRecord ? "Update Dispatch" : "Save Dispatch"}
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
                    <TableHead className="text-right">Bags Sent</TableHead>
                    <TableHead className="text-right">KGs Received</TableHead>
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
                      <TableCell className="text-right">
                        {record.kgs_received ? Number(record.kgs_received).toFixed(2) : "-"}
                      </TableCell>
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
