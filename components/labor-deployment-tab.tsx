"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useLaborData, type LaborDeployment, type LaborEntry } from "@/hooks/use-labor-data"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Download, Pencil } from "lucide-react"

const laborCodes: Record<string, string> = {
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

const formatDateForQIF = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`

function LaborDeploymentTab() {
  const { deployments, addDeployment, updateDeployment, deleteDeployment, loading } = useLaborData()
  const { isAdmin } = useAuth()

  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [entries, setEntries] = useState<Omit<LaborEntry, "id">[]>([])
  const [notes, setNotes] = useState("")

  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<LaborDeployment | null>(null)
  const [editedEntries, setEditedEntries] = useState<LaborEntry[]>([])
  const [editedNotes, setEditedNotes] = useState("")

  useEffect(() => {
    setDescription(laborCodes[code] ?? "Custom code")
  }, [code])

  const addHfLaborRow = () => setEntries((e) => [...e, { laborCount: 0, costPerLabor: 475 }])
  const addOutsideLaborRow = () => setEntries((e) => [...e, { laborCount: 0, costPerLabor: 450 }])
  const handleRemoveRow = (idx: number) => setEntries((e) => e.filter((_, i) => i !== idx))
  const handleEntryChange = (idx: number, key: keyof Omit<LaborEntry, "id">, value: string) =>
    setEntries((e) => e.map((row, i) => (i === idx ? { ...row, [key]: Number(value) } : row)))

  const handleEditEntryChange = (idx: number, key: keyof LaborEntry, value: string) => {
    setEditedEntries((current) => current.map((entry, i) => (i === idx ? { ...entry, [key]: Number(value) } : entry)))
  }
  const addEditedHfLaborRow = () => setEditedEntries((e) => [...e, { laborCount: 0, costPerLabor: 475 }])
  const addEditedOutsideLaborRow = () => setEditedEntries((e) => [...e, { laborCount: 0, costPerLabor: 450 }])
  const handleRemoveEditedRow = (idx: number) => setEditedEntries((e) => e.filter((_, i) => i !== idx))

  const handleEditClick = (deployment: LaborDeployment) => {
    setSelectedDeployment(deployment)
    setEditedEntries(deployment.laborEntries)
    setEditedNotes(deployment.notes || "")
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedDeployment) return

    const updatedDeployment = {
      ...selectedDeployment,
      laborEntries: editedEntries,
      notes: editedNotes,
    }

    const ok = await updateDeployment(updatedDeployment)
    if (ok) {
      toast({ title: "Success", description: "Deployment updated successfully." })
      setIsEditDialogOpen(false)
      setSelectedDeployment(null)
    }
  }

  const handleDeleteConfirm = async (id: string) => {
    const ok = await deleteDeployment(id)
    if (ok) {
      toast({ title: "Success", description: "Deployment deleted successfully." })
    }
  }

  const onSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!code || entries.length === 0 || entries.some((e) => e.laborCount <= 0 || e.costPerLabor < 0)) {
      toast({
        title: "Invalid input",
        description: "Please supply a labour code and valid numbers for all rows.",
        variant: "destructive",
      })
      return
    }
    const ok = await addDeployment({ code, reference: code, laborEntries: entries, notes, user: "admin" })
    if (ok) {
      setCode("")
      setEntries([])
      setNotes("")
    }
  }

  const exportToQIF = () => {
    let qif = "!Type:Bank\n"
    deployments.forEach((d) => {
      const when = new Date(d.date)
      qif += `D${formatDateForQIF(when)}\n`
      qif += `T-${d.totalCost.toFixed(2)}\n`
      qif += `P${laborCodes[d.reference] ?? d.reference}\n`
      if (d.notes) qif += `M${d.notes}\n`
      qif += "^\n"
    })
    const blob = new Blob([qif], { type: "application/qif" })
    const url = URL.createObjectURL(blob)
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: `labor_${new Date().toISOString().slice(0, 10)}.qif`,
    })
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Labor Deployment</CardTitle>
          <CardDescription>Record a new labor entry.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="code">Labour Code</Label>
              <Input id="code" placeholder="e.g. 152" value={code} onChange={(e) => setCode(e.target.value.trim())} />
              <p className="mt-1 h-5 text-sm text-muted-foreground">{code && description}</p>
            </div>
            {entries.map((row, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`count-${i}`}># Labourers</Label>
                  <Input
                    id={`count-${i}`}
                    type="number"
                    min={0}
                    value={row.laborCount || ""}
                    onChange={(e) => handleEntryChange(i, "laborCount", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`cost-${i}`}>Cost per Labour (₹)</Label>
                  <Input
                    id={`cost-${i}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.costPerLabor || ""}
                    onChange={(e) => handleEntryChange(i, "costPerLabor", e.target.value)}
                  />
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveRow(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addHfLaborRow}>
                <Plus className="mr-2 size-4" /> Add HF Labor (₹475)
              </Button>
              <Button type="button" variant="outline" onClick={addOutsideLaborRow}>
                <Plus className="mr-2 size-4" /> Add Outside Labor (₹450)
              </Button>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Record Deployment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deployment History</CardTitle>
            <CardDescription>Recent labour deployments</CardDescription>
          </div>
          <Button variant="outline" onClick={exportToQIF}>
            <Download className="mr-2 size-4" /> Export QIF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>HF Labor</TableHead>
                  <TableHead>Outside Labor</TableHead>
                  <TableHead>Total (₹)</TableHead>
                  <TableHead>Notes</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((d) => {
                  const hfLabor = d.laborEntries
                    .filter((le) => le.costPerLabor === 475)
                    .map((le) => `${le.laborCount} @ ₹${le.costPerLabor.toFixed(2)}`)
                    .join(", ")
                  const outsideLabor = d.laborEntries
                    .filter((le) => le.costPerLabor === 450)
                    .map((le) => `${le.laborCount} @ ₹${le.costPerLabor.toFixed(2)}`)
                    .join(", ")
                  return (
                    <TableRow key={d.id}>
                      <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                      <TableCell>{laborCodes[d.reference] ?? d.reference}</TableCell>
                      <TableCell>{hfLabor}</TableCell>
                      <TableCell>{outsideLabor}</TableCell>
                      <TableCell>₹{d.totalCost.toFixed(2)}</TableCell>
                      <TableCell>{d.notes}</TableCell>
                      {isAdmin && (
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditClick(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the deployment record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteConfirm(d.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deployment</DialogTitle>
            <DialogDescription>
              Editing deployment for {selectedDeployment ? laborCodes[selectedDeployment.reference] : ""} on{" "}
              {selectedDeployment ? new Date(selectedDeployment.date).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            {editedEntries.map((row, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`edit-count-${i}`}># Labourers</Label>
                  <Input
                    id={`edit-count-${i}`}
                    type="number"
                    min={0}
                    value={row.laborCount || ""}
                    onChange={(e) => handleEditEntryChange(i, "laborCount", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`edit-cost-${i}`}>Cost per Labour (₹)</Label>
                  <Input
                    id={`edit-cost-${i}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.costPerLabor || ""}
                    onChange={(e) => handleEditEntryChange(i, "costPerLabor", e.target.value)}
                  />
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveEditedRow(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addEditedHfLaborRow}>
                <Plus className="mr-2 size-4" /> Add HF Labor (₹475)
              </Button>
              <Button type="button" variant="outline" onClick={addEditedOutsideLaborRow}>
                <Plus className="mr-2 size-4" /> Add Outside Labor (₹450)
              </Button>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Optional notes"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { LaborDeploymentTab }
