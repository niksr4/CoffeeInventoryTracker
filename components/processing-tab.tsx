"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Save, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ProcessingRecord {
  id?: number
  process_date: string
  crop_today: number
  crop_todate: number
  ripe_today: number
  ripe_todate: number
  ripe_percent: number
  green_today: number
  green_todate: number
  green_percent: number
  float_today: number
  float_todate: number
  float_percent: number
  wet_parchment: number
  fr_wp_percent: number
  dry_parch: number
  dry_p_todate: number
  wp_dp_percent: number
  dry_cherry: number
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
  crop_today: 0,
  crop_todate: 0,
  ripe_today: 0,
  ripe_todate: 0,
  ripe_percent: 0,
  green_today: 0,
  green_todate: 0,
  green_percent: 0,
  float_today: 0,
  float_todate: 0,
  float_percent: 0,
  wet_parchment: 0,
  fr_wp_percent: 0,
  dry_parch: 0,
  dry_p_todate: 0,
  wp_dp_percent: 0,
  dry_cherry: 0,
  dry_cherry_todate: 0,
  dry_cherry_percent: 0,
  dry_p_bags: 0,
  dry_p_bags_todate: 0,
  dry_cherry_bags: 0,
  dry_cherry_bags_todate: 0,
  notes: "",
}

function ProcessingTab() {
  const [date, setDate] = useState<Date>(new Date())
  const [record, setRecord] = useState<Omit<ProcessingRecord, "id">>(emptyRecord)
  const [previousRecord, setPreviousRecord] = useState<ProcessingRecord | null>(null)
  const [recentRecords, setRecentRecords] = useState<ProcessingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadRecentRecords()
  }, [])

  useEffect(() => {
    loadRecordForDate(date)
  }, [date])

  // Auto-calculate derived fields whenever relevant fields change
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

      // Calculate crop_todate: previous todate + today
      if (previousRecord) {
        updated.crop_todate = (previousRecord.crop_todate || 0) + (prev.crop_today || 0)
        updated.ripe_todate = (previousRecord.ripe_todate || 0) + (prev.ripe_today || 0)
        updated.green_todate = (previousRecord.green_todate || 0) + (prev.green_today || 0)
        updated.float_todate = (previousRecord.float_todate || 0) + (prev.float_today || 0)
        updated.dry_p_todate = (previousRecord.dry_p_todate || 0) + (prev.dry_parch || 0)
        updated.dry_cherry_todate = (previousRecord.dry_cherry_todate || 0) + (prev.dry_cherry || 0)
      } else {
        updated.crop_todate = prev.crop_today || 0
        updated.ripe_todate = prev.ripe_today || 0
        updated.green_todate = prev.green_today || 0
        updated.float_todate = prev.float_today || 0
        updated.dry_p_todate = prev.dry_parch || 0
        updated.dry_cherry_todate = prev.dry_cherry || 0
      }

      // Calculate percentages
      const cropToday = prev.crop_today || 0
      if (cropToday > 0) {
        updated.ripe_percent = Number.parseFloat((((prev.ripe_today || 0) / cropToday) * 100).toFixed(2))
        updated.green_percent = Number.parseFloat((((prev.green_today || 0) / cropToday) * 100).toFixed(2))
        updated.float_percent = Number.parseFloat((((prev.float_today || 0) / cropToday) * 100).toFixed(2))
      } else {
        updated.ripe_percent = 0
        updated.green_percent = 0
        updated.float_percent = 0
      }

      // FR-WP %: wet parchment / ripe today * 100
      const ripeToday = prev.ripe_today || 0
      if (ripeToday > 0) {
        updated.fr_wp_percent = Number.parseFloat((((prev.wet_parchment || 0) / ripeToday) * 100).toFixed(2))
      } else {
        updated.fr_wp_percent = 0
      }

      // WP-DP %: dry parch / wet parchment * 100
      const wetParchment = prev.wet_parchment || 0
      if (wetParchment > 0) {
        updated.wp_dp_percent = Number.parseFloat((((prev.dry_parch || 0) / wetParchment) * 100).toFixed(2))
      } else {
        updated.wp_dp_percent = 0
      }

      // Dry Cherry %: dry cherry / crop today * 100
      if (cropToday > 0) {
        updated.dry_cherry_percent = Number.parseFloat((((prev.dry_cherry || 0) / cropToday) * 100).toFixed(2))
      } else {
        updated.dry_cherry_percent = 0
      }

      // Calculate bags: kg / 50 (with 2 decimal places)
      updated.dry_p_bags = Number.parseFloat(((prev.dry_parch || 0) / 50).toFixed(2))
      updated.dry_cherry_bags = Number.parseFloat(((prev.dry_cherry || 0) / 50).toFixed(2))

      // Calculate bags to date
      if (previousRecord) {
        updated.dry_p_bags_todate = Number.parseFloat(
          ((previousRecord.dry_p_bags_todate || 0) + updated.dry_p_bags).toFixed(2),
        )
        updated.dry_cherry_bags_todate = Number.parseFloat(
          ((previousRecord.dry_cherry_bags_todate || 0) + updated.dry_cherry_bags).toFixed(2),
        )
      } else {
        updated.dry_p_bags_todate = updated.dry_p_bags
        updated.dry_cherry_bags_todate = updated.dry_cherry_bags
      }

      return updated
    })
  }

  const loadRecentRecords = async () => {
    try {
      const response = await fetch("/api/processing-records")
      const data = await response.json()
      if (data.success) {
        setRecentRecords(data.records || [])
      }
    } catch (error) {
      console.error("Error loading recent records:", error)
    }
  }

  const loadRecordForDate = async (selectedDate: Date) => {
    setIsLoading(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")

      // Load the record for the selected date
      const response = await fetch(`/api/processing-records?date=${dateStr}`)
      const data = await response.json()

      if (data.success && data.record) {
        setRecord(data.record)
      } else {
        setRecord({ ...emptyRecord, process_date: dateStr })
      }

      // Load the previous day's record for todate calculations
      const previousDate = new Date(selectedDate)
      previousDate.setDate(previousDate.getDate() - 1)
      const prevDateStr = format(previousDate, "yyyy-MM-dd")

      const prevResponse = await fetch(`/api/processing-records?date=${prevDateStr}`)
      const prevData = await prevResponse.json()

      if (prevData.success && prevData.record) {
        setPreviousRecord(prevData.record)
      } else {
        setPreviousRecord(null)
      }
    } catch (error) {
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
        body: JSON.stringify(record),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Processing record saved successfully",
        })
        loadRecentRecords()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
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
      const response = await fetch(`/api/processing-records?date=${record.process_date}`, {
        method: "DELETE",
      })

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

  const updateField = (field: keyof ProcessingRecord, value: number | string) => {
    setRecord((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Processing Records</CardTitle>
          <CardDescription>Track daily coffee processing from cherry to final bags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Picker */}
          <div className="flex items-center gap-4">
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
                      value={record.crop_today}
                      onChange={(e) => updateField("crop_today", Number.parseFloat(e.target.value) || 0)}
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
                      value={record.ripe_today}
                      onChange={(e) => updateField("ripe_today", Number.parseFloat(e.target.value) || 0)}
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
                      value={record.green_today}
                      onChange={(e) => updateField("green_today", Number.parseFloat(e.target.value) || 0)}
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
                      value={record.float_today}
                      onChange={(e) => updateField("float_today", Number.parseFloat(e.target.value) || 0)}
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
                      value={record.wet_parchment}
                      onChange={(e) => updateField("wet_parchment", Number.parseFloat(e.target.value) || 0)}
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
                      value={record.dry_parch}
                      onChange={(e) => updateField("dry_parch", Number.parseFloat(e.target.value) || 0)}
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
                      value={record.dry_cherry}
                      onChange={(e) => updateField("dry_cherry", Number.parseFloat(e.target.value) || 0)}
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

      {/* Recent Records */}
      {recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRecords.map((rec) => (
                <Button
                  key={rec.id}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    setDate(new Date(rec.process_date))
                  }}
                >
                  {format(new Date(rec.process_date), "PPP")} - Crop: {rec.crop_today}kg, Bags: {rec.dry_p_bags}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Export both named and default
export { ProcessingTab }
export default ProcessingTab
