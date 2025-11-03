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
import { CalendarIcon, Loader2, Save, Trash2, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ProcessingRecord {
  id?: number
  process_date: string
  crop_today: number | null
  crop_todate: number
  ripe_today: number | null
  ripe_todate: number
  ripe_percent: number
  green_today: number | null
  green_todate: number
  green_percent: number
  float_today: number | null
  float_todate: number
  float_percent: number
  wet_parchment: number | null
  fr_wp_percent: number
  dry_parch: number | null
  dry_p_todate: number
  wp_dp_percent: number
  dry_cherry: number | null
  dry_cherry_todate: number
  dry_cherry_percent: number
  dry_p_bags: number
  dry_p_bags_todate: number
  dry_cherry_bags: number
  dry_cherry_bags_todate: number
  notes: string
}

const emptyRecord: Omit<ProcessingRecord, "id"> = {
  process_date: format(new Date(), "yyyy-MM-dd"),
  crop_today: null,
  crop_todate: 0,
  ripe_today: null,
  ripe_todate: 0,
  ripe_percent: 0,
  green_today: null,
  green_todate: 0,
  green_percent: 0,
  float_today: null,
  float_todate: 0,
  float_percent: 0,
  wet_parchment: null,
  fr_wp_percent: 0,
  dry_parch: null,
  dry_p_todate: 0,
  wp_dp_percent: 0,
  dry_cherry: null,
  dry_cherry_todate: 0,
  dry_cherry_percent: 0,
  dry_p_bags: 0,
  dry_p_bags_todate: 0,
  dry_cherry_bags: 0,
  dry_cherry_bags_todate: 0,
  notes: "",
}

const LOCATIONS = ["HF Arabica", "HF Robusta", "MV Robusta", "PG Robusta"]

export default function ProcessingTab() {
  const [date, setDate] = useState<Date>(new Date())
  const [location, setLocation] = useState<string>("HF Arabica")
  const [record, setRecord] = useState<Omit<ProcessingRecord, "id">>(emptyRecord)
  const [previousRecord, setPreviousRecord] = useState<ProcessingRecord | null>(null)
  const [recentRecords, setRecentRecords] = useState<ProcessingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log("Location changed to:", location)
    loadRecentRecords()
  }, [location])

  useEffect(() => {
    console.log("Date or location changed, loading record for date:", format(date, "yyyy-MM-dd"))
    loadRecordForDate(date)
  }, [date, location])

  useEffect(() => {
    autoCalculateFields()
  }, [
    record.crop_today,
    record.ripe_today,
    record.green_today,
    record.float_today,
    record.wet_parchment,
    record.dry_parch,
    record.dry_cherry,
    previousRecord,
  ])

  const autoCalculateFields = () => {
    setRecord((prev) => {
      const updated = { ...prev }

      const cropToday = Number(prev.crop_today) || 0
      const ripeToday = Number(prev.ripe_today) || 0
      const greenToday = Number(prev.green_today) || 0
      const floatToday = Number(prev.float_today) || 0
      const wetParchment = Number(prev.wet_parchment) || 0
      const dryParch = Number(prev.dry_parch) || 0
      const dryCherry = Number(prev.dry_cherry) || 0

      if (previousRecord) {
        const prevCropTodate = Number(previousRecord.crop_todate) || 0
        const prevRipeTodate = Number(previousRecord.ripe_todate) || 0
        const prevGreenTodate = Number(previousRecord.green_todate) || 0
        const prevFloatTodate = Number(previousRecord.float_todate) || 0
        const prevDryPTodate = Number(previousRecord.dry_p_todate) || 0
        const prevDryCherryTodate = Number(previousRecord.dry_cherry_todate) || 0
        const prevDryPBagsTodate = Number(previousRecord.dry_p_bags_todate) || 0
        const prevDryCherryBagsTodate = Number(previousRecord.dry_cherry_bags_todate) || 0

        updated.crop_todate = Number.parseFloat((prevCropTodate + cropToday).toFixed(2))
        updated.ripe_todate = Number.parseFloat((prevRipeTodate + ripeToday).toFixed(2))
        updated.green_todate = Number.parseFloat((prevGreenTodate + greenToday).toFixed(2))
        updated.float_todate = Number.parseFloat((prevFloatTodate + floatToday).toFixed(2))
        updated.dry_p_todate = Number.parseFloat((prevDryPTodate + dryParch).toFixed(2))
        updated.dry_cherry_todate = Number.parseFloat((prevDryCherryTodate + dryCherry).toFixed(2))

        const dryPBags = Number.parseFloat((dryParch / 50).toFixed(2))
        const dryCherryBags = Number.parseFloat((dryCherry / 50).toFixed(2))

        updated.dry_p_bags = dryPBags
        updated.dry_cherry_bags = dryCherryBags
        updated.dry_p_bags_todate = Number.parseFloat((prevDryPBagsTodate + dryPBags).toFixed(2))
        updated.dry_cherry_bags_todate = Number.parseFloat((prevDryCherryBagsTodate + dryCherryBags).toFixed(2))
      } else {
        updated.crop_todate = cropToday
        updated.ripe_todate = ripeToday
        updated.green_todate = greenToday
        updated.float_todate = floatToday
        updated.dry_p_todate = dryParch
        updated.dry_cherry_todate = dryCherry

        updated.dry_p_bags = Number.parseFloat((dryParch / 50).toFixed(2))
        updated.dry_cherry_bags = Number.parseFloat((dryCherry / 50).toFixed(2))
        updated.dry_p_bags_todate = updated.dry_p_bags
        updated.dry_cherry_bags_todate = updated.dry_cherry_bags
      }

      if (cropToday > 0) {
        updated.ripe_percent = Number.parseFloat(((ripeToday / cropToday) * 100).toFixed(2))
        updated.green_percent = Number.parseFloat(((greenToday / cropToday) * 100).toFixed(2))
        updated.float_percent = Number.parseFloat(((floatToday / cropToday) * 100).toFixed(2))
        updated.dry_cherry_percent = Number.parseFloat(((dryCherry / cropToday) * 100).toFixed(2))
      } else {
        updated.ripe_percent = 0
        updated.green_percent = 0
        updated.float_percent = 0
        updated.dry_cherry_percent = 0
      }

      if (ripeToday > 0) {
        updated.fr_wp_percent = Number.parseFloat(((wetParchment / ripeToday) * 100).toFixed(2))
      } else {
        updated.fr_wp_percent = 0
      }

      if (wetParchment > 0) {
        updated.wp_dp_percent = Number.parseFloat(((dryParch / wetParchment) * 100).toFixed(2))
      } else {
        updated.wp_dp_percent = 0
      }

      return updated
    })
  }

  const loadRecentRecords = async () => {
    console.log("loadRecentRecords called for location:", location)
    setIsLoadingRecords(true)
    try {
      const url = `/api/processing-records?location=${encodeURIComponent(location)}`
      console.log("Fetching from URL:", url)

      const response = await fetch(url)
      const data = await response.json()

      console.log("Recent records response:", data)

      if (data.success) {
        if (Array.isArray(data.records)) {
          console.log("Setting recent records, count:", data.records.length)
          setRecentRecords(data.records)
        } else {
          console.warn("data.records is not an array:", data.records)
          setRecentRecords([])
        }
      } else {
        console.error("API returned success: false", data)
        setRecentRecords([])
        if (data.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error loading recent records:", error)
      setRecentRecords([])
      toast({
        title: "Error",
        description: "Failed to load recent records",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const loadRecordForDate = async (selectedDate: Date) => {
    setIsLoading(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      console.log("Loading record for date:", dateStr, "location:", location)

      const response = await fetch(`/api/processing-records?date=${dateStr}&location=${encodeURIComponent(location)}`)
      const data = await response.json()

      console.log("Record for date response:", data)

      if (data.success && data.record) {
        const record = data.record
        Object.keys(record).forEach((key) => {
          if (
            typeof record[key] === "string" &&
            !isNaN(Number(record[key])) &&
            key !== "process_date" &&
            key !== "notes"
          ) {
            record[key] = Number(record[key])
          }
        })
        setRecord(record)
      } else {
        setRecord({ ...emptyRecord, process_date: dateStr })
      }

      const previousDate = new Date(selectedDate)
      previousDate.setDate(previousDate.getDate() - 1)
      const prevDateStr = format(previousDate, "yyyy-MM-dd")

      const prevResponse = await fetch(
        `/api/processing-records?date=${prevDateStr}&location=${encodeURIComponent(location)}`,
      )
      const prevData = await prevResponse.json()

      if (prevData.success && prevData.record) {
        const prevRecord = prevData.record
        Object.keys(prevRecord).forEach((key) => {
          if (
            typeof prevRecord[key] === "string" &&
            !isNaN(Number(prevRecord[key])) &&
            key !== "process_date" &&
            key !== "notes"
          ) {
            prevRecord[key] = Number(prevRecord[key])
          }
        })
        setPreviousRecord(prevRecord)
      } else {
        setPreviousRecord(null)
      }
    } catch (error: any) {
      console.error("Error loading record:", error)
      toast({
        title: "Error",
        description: "Failed to load processing record",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/processing-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...record, location }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Processing record saved successfully for ${location}`,
        })

        await loadRecentRecords()

        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        setDate(nextDay)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save processing record",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(
        `/api/processing-records?date=${record.process_date}&location=${encodeURIComponent(location)}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        })
        setRecord({ ...emptyRecord, process_date: format(date, "yyyy-MM-dd") })
        loadRecentRecords()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive",
      })
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/processing-records?location=${encodeURIComponent(location)}`)
      const data = await response.json()

      let records: ProcessingRecord[] = []

      if (data.success && Array.isArray(data.records)) {
        records = data.records
      } else {
        throw new Error("No records to export")
      }

      if (records.length === 0) {
        toast({
          title: "No Data",
          description: "No records available to export",
          variant: "destructive",
        })
        return
      }

      records.sort((a, b) => new Date(a.process_date).getTime() - new Date(b.process_date).getTime())

      let cumulativeCrop = 0
      let cumulativeRipe = 0
      let cumulativeGreen = 0
      let cumulativeFloat = 0
      let cumulativeWetParchment = 0
      let cumulativeDryP = 0
      let cumulativeDryCherry = 0
      let cumulativeDryPBags = 0
      let cumulativeDryCherryBags = 0

      const processedRecords = records.map((rec) => {
        cumulativeCrop += Number(rec.crop_today) || 0
        cumulativeRipe += Number(rec.ripe_today) || 0
        cumulativeGreen += Number(rec.green_today) || 0
        cumulativeFloat += Number(rec.float_today) || 0
        cumulativeWetParchment += Number(rec.wet_parchment) || 0
        cumulativeDryP += Number(rec.dry_parch) || 0
        cumulativeDryCherry += Number(rec.dry_cherry) || 0
        cumulativeDryPBags += Number(rec.dry_p_bags) || 0
        cumulativeDryCherryBags += Number(rec.dry_cherry_bags) || 0

        return {
          ...rec,
          crop_todate: cumulativeCrop,
          ripe_todate: cumulativeRipe,
          green_todate: cumulativeGreen,
          float_todate: cumulativeFloat,
          wet_parchment_todate: cumulativeWetParchment,
          dry_p_todate: cumulativeDryP,
          dry_cherry_todate: cumulativeDryCherry,
          dry_p_bags_todate: cumulativeDryPBags,
          dry_cherry_bags_todate: cumulativeDryCherryBags,
        }
      })

      const headers = [
        "Date",
        "Crop Today (kg)",
        "Crop To Date (kg)",
        "Ripe Today (kg)",
        "Ripe To Date (kg)",
        "Ripe %",
        "Green Today (kg)",
        "Green To Date (kg)",
        "Green %",
        "Float Today (kg)",
        "Float To Date (kg)",
        "Float %",
        "Wet Parchment (kg)",
        "Wet Parchment To-Date (kg)",
        "FR-WP %",
        "Dry Parch (kg)",
        "Dry P To Date (kg)",
        "WP-DP %",
        "Dry Cherry (kg)",
        "Dry Cherry To Date (kg)",
        "Dry Cherry %",
        "Dry P Bags",
        "Dry P Bags To Date",
        "Dry Cherry Bags",
        "Dry Cherry Bags To Date",
        "Notes",
      ]

      const rows = processedRecords.map((rec: any) => [
        format(new Date(rec.process_date), "dd-MM-yyyy"),
        rec.crop_today ?? "",
        rec.crop_todate,
        rec.ripe_today ?? "",
        rec.ripe_todate,
        rec.ripe_percent,
        rec.green_today ?? "",
        rec.green_todate,
        rec.green_percent,
        rec.float_today ?? "",
        rec.float_todate,
        rec.float_percent,
        rec.wet_parchment ?? "",
        rec.wet_parchment_todate,
        rec.fr_wp_percent,
        rec.dry_parch ?? "",
        rec.dry_p_todate,
        rec.wp_dp_percent,
        rec.dry_cherry ?? "",
        rec.dry_cherry_todate,
        rec.dry_cherry_percent,
        rec.dry_p_bags,
        rec.dry_p_bags_todate,
        rec.dry_cherry_bags,
        rec.dry_cherry_bags_todate,
        `"${(rec.notes || "").replace(/"/g, '""')}"`,
      ])

      const csvContent = [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `${location.replace(/\s+/g, "-")}-processing-records-${format(new Date(), "yyyy-MM-dd")}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Processing records exported to CSV for ${location}`,
      })
    } catch (error: any) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to export CSV",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const updateField = (field: keyof ProcessingRecord, value: number | string | null) => {
    setRecord((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Processing Records</CardTitle>
              <CardDescription>Track daily coffee processing from cherry to final bags</CardDescription>
            </div>
            <Button onClick={handleExportCSV} disabled={isExporting} variant="outline">
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Location Picker */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>Location:</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Date:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>

          {!isLoading && (
            <>
              {/* Crop Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crop</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Crop Today (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.crop_today ?? ""}
                      onChange={(e) =>
                        updateField("crop_today", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter crop today"
                    />
                  </div>
                  <div>
                    <Label>Crop To Date (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.crop_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Ripe Cherry Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ripe Cherry</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ripe Today (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.ripe_today ?? ""}
                      onChange={(e) =>
                        updateField("ripe_today", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter ripe today"
                    />
                  </div>
                  <div>
                    <Label>Ripe To Date (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.ripe_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <Label>Ripe %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.ripe_percent}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Green Cherry Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Green Cherry</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Green Today (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.green_today ?? ""}
                      onChange={(e) =>
                        updateField("green_today", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter green today"
                    />
                  </div>
                  <div>
                    <Label>Green To Date (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.green_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <Label>Green %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.green_percent}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Float Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Float</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Float Today (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.float_today ?? ""}
                      onChange={(e) =>
                        updateField("float_today", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter float today"
                    />
                  </div>
                  <div>
                    <Label>Float To Date (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.float_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <Label>Float %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.float_percent}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Wet Parchment Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Wet Parchment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Wet Parchment (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.wet_parchment ?? ""}
                      onChange={(e) =>
                        updateField("wet_parchment", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter wet parchment"
                    />
                  </div>
                  <div>
                    <Label>FR-WP %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.fr_wp_percent}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated (WP/Ripe Today)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Dry Parchment Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dry Parchment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Dry Parch (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_parch ?? ""}
                      onChange={(e) =>
                        updateField("dry_parch", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter dry parch"
                    />
                  </div>
                  <div>
                    <Label>Dry P To Date (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_p_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <Label>WP-DP %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.wp_dp_percent}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated (DP/WP)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Dry Cherry Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dry Cherry</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Dry Cherry (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_cherry ?? ""}
                      onChange={(e) =>
                        updateField("dry_cherry", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                      }
                      placeholder="Enter dry cherry"
                    />
                  </div>
                  <div>
                    <Label>Dry Cherry To Date (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_cherry_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <Label>Dry Cherry %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_cherry_percent}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bags Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bags</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dry P Bags</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_p_bags}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated (kg/50)</p>
                  </div>
                  <div>
                    <Label>Dry P Bags To Date</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_p_bags_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                  <div>
                    <Label>Dry Cherry Bags</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_cherry_bags}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated (kg/50)</p>
                  </div>
                  <div>
                    <Label>Dry Cherry Bags To Date</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={record.dry_cherry_bags_todate}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={record.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Additional notes about today's processing..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
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
                {record.process_date && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Records - Always show this section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Records - {location}</CardTitle>
          <CardDescription>
            {isLoadingRecords ? "Loading..." : `${recentRecords.length} record(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading recent records...</span>
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No records found for {location}</p>
              <p className="text-sm mt-2">Add your first record above to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRecords.map((rec) => (
                <Button
                  key={rec.id}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    console.log("Clicking record:", rec)
                    setDate(new Date(rec.process_date))
                  }}
                >
                  <div className="flex justify-between w-full">
                    <span>{format(new Date(rec.process_date), "PPP")}</span>
                    <span className="text-muted-foreground">
                      Crop: {rec.crop_today ?? 0}kg | Bags: {rec.dry_p_bags}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
