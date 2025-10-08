"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Download, Loader2, Save, Leaf } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const locations = ["HF Pepper", "PG Pepper", "MV Pepper"]

interface PepperRecord {
  id: number
  process_date: string
  kg_picked: number
  green_pepper: number
  green_pepper_percent: number
  dry_pepper: number
  dry_pepper_percent: number
  notes: string
  recorded_by: string
  created_at: string
  updated_at: string
}

export function PepperTab() {
  const [selectedLocation, setSelectedLocation] = useState("HF Pepper")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [kgPicked, setKgPicked] = useState("")
  const [greenPepper, setGreenPepper] = useState("")
  const [dryPepper, setDryPepper] = useState("")
  const [notes, setNotes] = useState("")
  const [recentRecords, setRecentRecords] = useState<PepperRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Calculate percentages
  const greenPepperPercent =
    kgPicked && greenPepper ? ((Number.parseFloat(greenPepper) / Number.parseFloat(kgPicked)) * 100).toFixed(2) : "0.00"
  const dryPepperPercent =
    greenPepper && dryPepper
      ? ((Number.parseFloat(dryPepper) / Number.parseFloat(greenPepper)) * 100).toFixed(2)
      : "0.00"

  // Fetch recent records
  const fetchRecentRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pepper-records?location=${encodeURIComponent(selectedLocation)}`)
      const data = await response.json()

      if (data.success) {
        setRecentRecords(data.records || [])
      }
    } catch (error) {
      console.error("Error fetching pepper records:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch record for selected date
  const fetchRecordForDate = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const response = await fetch(
        `/api/pepper-records?location=${encodeURIComponent(selectedLocation)}&date=${dateStr}`,
      )
      const data = await response.json()

      if (data.success && data.record) {
        const record = data.record
        setKgPicked(record.kg_picked?.toString() || "")
        setGreenPepper(record.green_pepper?.toString() || "")
        setDryPepper(record.dry_pepper?.toString() || "")
        setNotes(record.notes || "")
      } else {
        // Clear form for new entry
        setKgPicked("")
        setGreenPepper("")
        setDryPepper("")
        setNotes("")
      }
    } catch (error) {
      console.error("Error fetching record:", error)
    }
  }

  // Load recent records when location changes
  useEffect(() => {
    fetchRecentRecords()
  }, [selectedLocation])

  // Load record when date changes
  useEffect(() => {
    fetchRecordForDate(selectedDate)
  }, [selectedDate, selectedLocation])

  const handleSave = async () => {
    if (!kgPicked || !greenPepper || !dryPepper) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/pepper-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: selectedLocation,
          process_date: format(selectedDate, "yyyy-MM-dd"),
          kg_picked: Number.parseFloat(kgPicked),
          green_pepper: Number.parseFloat(greenPepper),
          green_pepper_percent: Number.parseFloat(greenPepperPercent),
          dry_pepper: Number.parseFloat(dryPepper),
          dry_pepper_percent: Number.parseFloat(dryPepperPercent),
          notes,
          recorded_by: "user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Record saved successfully!" })
        fetchRecentRecords()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save record" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save record" })
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
    if (recentRecords.length === 0) return

    const headers = ["Date", "KG Picked", "Green Pepper", "Green %", "Dry Pepper", "Dry %", "Notes"]
    const rows = recentRecords.map((record) => [
      format(new Date(record.process_date), "yyyy-MM-dd"),
      record.kg_picked,
      record.green_pepper,
      record.green_pepper_percent,
      record.dry_pepper,
      record.dry_pepper_percent,
      record.notes || "",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pepper-${selectedLocation.toLowerCase().replace(" ", "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const loadRecord = (record: PepperRecord) => {
    setSelectedDate(new Date(record.process_date))
    setKgPicked(record.kg_picked.toString())
    setGreenPepper(record.green_pepper.toString())
    setDryPepper(record.dry_pepper.toString())
    setNotes(record.notes || "")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Pepper Tracking</h2>
        </div>
      </div>

      {/* Location and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Record Pepper Data</CardTitle>
          <CardDescription>Track pepper harvest and processing by location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Selector */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kgPicked">KG Picked *</Label>
              <Input
                id="kgPicked"
                type="number"
                step="0.01"
                value={kgPicked}
                onChange={(e) => setKgPicked(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="greenPepper">Green Pepper (KG) *</Label>
              <Input
                id="greenPepper"
                type="number"
                step="0.01"
                value={greenPepper}
                onChange={(e) => setGreenPepper(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Green Pepper %</Label>
              <Input value={greenPepperPercent} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dryPepper">Dry Pepper (KG) *</Label>
              <Input
                id="dryPepper"
                type="number"
                step="0.01"
                value={dryPepper}
                onChange={(e) => setDryPepper(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Dry Pepper %</Label>
              <Input value={dryPepperPercent} disabled className="bg-muted" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Record
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Records</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={recentRecords.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <CardDescription>Click a row to load that record</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No records found for this location</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">KG Picked</TableHead>
                    <TableHead className="text-right">Green Pepper</TableHead>
                    <TableHead className="text-right">Green %</TableHead>
                    <TableHead className="text-right">Dry Pepper</TableHead>
                    <TableHead className="text-right">Dry %</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => loadRecord(record)}
                    >
                      <TableCell>{format(new Date(record.process_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">{record.kg_picked.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{record.green_pepper.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{record.green_pepper_percent.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{record.dry_pepper.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{record.dry_pepper_percent.toFixed(2)}%</TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes || "-"}</TableCell>
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
