"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, Database, FileText } from "lucide-react"
import {
  type Transaction,
  getAllInventoryItems,
  getAllTransactions,
  performBatchOperation,
} from "@/lib/inventory-service"

export function DataImportExport() {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [csvData, setCsvData] = useState("")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleCSVImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please paste CSV data to import",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      const lines = csvData.trim().split("\n")
      const headers = lines[0]
        .toLowerCase()
        .split(",")
        .map((h) => h.trim())

      // Validate headers
      const requiredHeaders = ["name", "quantity", "unit"]
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`)
      }

      const nameIndex = headers.indexOf("name")
      const quantityIndex = headers.indexOf("quantity")
      const unitIndex = headers.indexOf("unit")

      // Parse CSV data into transactions
      const newTransactions: Transaction[] = []
      const currentTransactions = await getAllTransactions()

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length < 3) continue

        const name = values[nameIndex]
        const quantity = Number.parseInt(values[quantityIndex])
        const unit = values[unitIndex]

        if (!name || isNaN(quantity) || !unit) continue

        // Create a restocking transaction for each item
        newTransactions.push({
          id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          itemType: name,
          quantity,
          transactionType: "Restocking",
          notes: "Imported from CSV",
          date:
            new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) +
            " " +
            new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          user: "import",
          unit,
        })
      }

      // Combine with existing transactions
      const allTransactions = [...newTransactions, ...currentTransactions]
      await performBatchOperation(allTransactions)

      toast({
        title: "Import Successful",
        description: `Imported ${newTransactions.length} items from CSV`,
      })

      setCsvData("")
      setImportDialogOpen(false)
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV data",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleCSVExport = async () => {
    setIsExporting(true)
    try {
      const items = await getAllInventoryItems()
      const csvContent = [
        "Name,Quantity,Unit",
        ...items.map((item) => `${item.name},${item.quantity},${item.unit}`),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Inventory data exported to CSV file",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export inventory data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleQIFExport = async () => {
    setIsExporting(true)
    try {
      const transactions = await getAllTransactions()
      const qifContent = [
        "!Type:Cash",
        ...transactions.map((transaction) => {
          const amount = transaction.transactionType === "Restocking" ? transaction.quantity : -transaction.quantity
          return [
            `D${transaction.date.split(" ")[0]}`,
            `T${amount}`,
            `P${transaction.itemType}`,
            `M${transaction.notes}`,
            "^",
          ].join("\n")
        }),
      ].join("\n")

      const blob = new Blob([qifContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-export-${new Date().toISOString().split("T")[0]}.qif`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "QIF Export Successful",
        description: "Transaction data exported for accounting software",
      })
    } catch (error) {
      toast({
        title: "QIF Export Failed",
        description: "Failed to export transaction data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleBackup = async () => {
    setIsExporting(true)
    try {
      const [items, transactions] = await Promise.all([getAllInventoryItems(), getAllTransactions()])

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        inventory: items,
        transactions,
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `honey-farm-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup Created",
        description: "Complete system backup downloaded",
      })
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CSV Import */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </CardTitle>
            <CardDescription className="text-xs">Import inventory from spreadsheet</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Import Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Inventory from CSV</DialogTitle>
                  <DialogDescription>
                    Paste your CSV data below. Required columns: Name, Quantity, Unit
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-data">CSV Data</Label>
                    <Textarea
                      id="csv-data"
                      placeholder="Name,Quantity,Unit&#10;Honey,100,kg&#10;Wax,50,kg"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCSVImport} disabled={isImporting}>
                      {isImporting ? "Importing..." : "Import"}
                    </Button>
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* CSV Export */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </CardTitle>
            <CardDescription className="text-xs">Download inventory as spreadsheet</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={handleCSVExport}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* QIF Export */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export QIF
            </CardTitle>
            <CardDescription className="text-xs">For QuickBooks & accounting software</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={handleQIFExport}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export QIF"}
            </Button>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backup Data
            </CardTitle>
            <CardDescription className="text-xs">Complete system backup</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={handleBackup}
              disabled={isExporting}
            >
              {isExporting ? "Creating..." : "Backup"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
