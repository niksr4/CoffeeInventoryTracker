"use client"

import { useMemo } from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLaborData, type LaborEntry, type LaborDeployment } from "@/hooks/use-labor-data"
import { useConsumablesData, type ConsumableDeployment } from "@/hooks/use-consumables-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Coins, ClipboardList, Droplets, List } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import LaborDeploymentTab from "./labor-deployment-tab"
import OtherExpensesTab from "./other-expenses-tab"
import { formatDateOnly, formatDateForQIF } from "@/lib/date-utils"

interface AccountActivity {
  code: string
  reference: string
}

interface Activity {
  code: string
  reference: string
}

export default function AccountsPage() {
  const { isAdmin } = useAuth()
  const { deployments: laborDeployments, loading: laborLoading } = useLaborData()
  const { deployments: consumableDeployments, loading: consumablesLoading } = useConsumablesData()

  const [exportStartDate, setExportStartDate] = useState<string>("")
  const [exportEndDate, setExportEndDate] = useState<string>("")
  const [accountActivities, setAccountActivities] = useState<AccountActivity[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    fetchAllActivities()
    fetchAccountActivities()
  }, [])

  const fetchAllActivities = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/get-activity")
      const data = await response.json()
      console.log("Fetched activities:", data)

      if (data.activities) {
        // Map 'activity' field to 'reference' for display
        const mappedActivities = data.activities.map((item: any) => ({
          code: item.code,
          reference: item.activity,
        }))
        setActivities(mappedActivities)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccountActivities = async () => {
    setLoadingActivities(true)
    try {
      const response = await fetch("/api/get-activity")
      const data = await response.json()
      console.log("Account activities response:", data)
      if (data.success && data.activities) {
        setAccountActivities(data.activities)
      }
    } catch (error) {
      console.error("Error fetching account activities:", error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const laborTotal = useMemo(() => {
    return laborDeployments.reduce((total, deployment) => total + deployment.totalCost, 0)
  }, [laborDeployments])

  const otherExpensesTotal = useMemo(() => {
    return consumableDeployments.reduce((total, deployment) => total + deployment.amount, 0)
  }, [consumableDeployments])

  const grandTotal = useMemo(() => {
    return laborTotal + otherExpensesTotal
  }, [laborTotal, otherExpensesTotal])

  const combinedDeployments = useMemo(() => {
    const typedLaborDeployments = laborDeployments.map((d) => ({ ...d, entryType: "Labor" }))
    const typedConsumableDeployments = consumableDeployments.map((d) => ({ ...d, entryType: "Other Expense" }))

    const allDeployments = [
      ...typedLaborDeployments,
      ...typedConsumableDeployments.map((cd) => ({ ...cd, totalCost: cd.amount })),
    ] as (
      | (LaborDeployment & { entryType: "Labor"; totalCost: number })
      | (ConsumableDeployment & { entryType: "Other Expense"; totalCost: number })
    )[]

    return allDeployments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [laborDeployments, consumableDeployments])

  const getFilteredDeploymentsForExport = () => {
    let deploymentsToExport = [...combinedDeployments]
    if (exportStartDate && exportEndDate) {
      const startDate = new Date(exportStartDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(exportEndDate)
      endDate.setHours(23, 59, 59, 999)
      if (startDate > endDate) {
        alert("Start date cannot be after end date.")
        return null
      }
      deploymentsToExport = deploymentsToExport.filter((d) => {
        const deploymentDate = new Date(d.date)
        return deploymentDate >= startDate && deploymentDate <= endDate
      })
    } else if (exportStartDate || exportEndDate) {
      alert("Please select both start and end date for filtering, or leave both empty to export all.")
      return null
    }

    if (deploymentsToExport.length === 0) {
      alert("No entries found for the selected date range.")
      return null
    }
    return deploymentsToExport
  }

  const exportCombinedCSV = () => {
    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return ""
      const stringField = String(field)
      if (stringField.search(/("|,|\n)/g) >= 0) return `"${stringField.replace(/"/g, '""')}"`
      return stringField
    }

    const deploymentsToExport = getFilteredDeploymentsForExport()
    if (!deploymentsToExport) return

    deploymentsToExport.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    const headers = [
      "Date",
      "Entry Type",
      "Code",
      "Reference",
      "HF Labor Details",
      "Outside Labor Details",
      "Total Expenditure (₹)",
      "Notes",
      "Recorded By",
    ]

    const rows = deploymentsToExport.map((d) => {
      let hfLaborDetails = ""
      let outsideLaborDetails = ""
      if (d.entryType === "Labor" && d.laborEntries && d.laborEntries.length > 0) {
        const hfEntry = d.laborEntries[0]
        hfLaborDetails = `${hfEntry.laborCount} @ ${hfEntry.costPerLabor.toFixed(2)}`
        if (d.laborEntries.length > 1) {
          outsideLaborDetails = d.laborEntries
            .slice(1)
            .map((le: LaborEntry) => `${le.laborCount} @ ${le.costPerLabor.toFixed(2)}`)
            .join("; ")
        }
      }
      const expenditureAmount = d.entryType === "Labor" ? d.totalCost : (d as ConsumableDeployment).amount
      return [
        escapeCsvField(formatDateOnly(d.date)),
        escapeCsvField(d.entryType),
        escapeCsvField(d.code),
        escapeCsvField(d.reference),
        escapeCsvField(hfLaborDetails),
        escapeCsvField(outsideLaborDetails),
        escapeCsvField(expenditureAmount.toFixed(2)),
        escapeCsvField(d.notes),
        escapeCsvField(d.user),
      ]
    })

    let csvContent = "data:text/csv;charset=utf-8," + headers.map(escapeCsvField).join(",") + "\n"
    csvContent += rows.map((row) => row.join(",")).join("\n")

    let totalHfLaborCount = 0,
      totalHfLaborCost = 0
    let totalOutsideLaborCount = 0,
      totalOutsideLaborCost = 0
    let totalConsumablesCost = 0
    const totalsByCode: { [code: string]: number } = {}

    deploymentsToExport.forEach((d) => {
      const expenditureAmount = d.entryType === "Labor" ? d.totalCost : (d as ConsumableDeployment).amount
      totalsByCode[d.code] = (totalsByCode[d.code] || 0) + expenditureAmount

      if (d.entryType === "Labor") {
        if (d.laborEntries && d.laborEntries.length > 0) {
          const hfEntry = d.laborEntries[0]
          totalHfLaborCount += hfEntry.laborCount
          totalHfLaborCost += hfEntry.laborCount * hfEntry.costPerLabor
        }
        if (d.laborEntries && d.laborEntries.length > 1) {
          d.laborEntries.slice(1).forEach((le) => {
            totalOutsideLaborCount += le.laborCount
            totalOutsideLaborCost += le.laborCount * le.costPerLabor
          })
        }
      } else {
        totalConsumablesCost += (d as ConsumableDeployment).amount
      }
    })
    const grandTotalForExport = totalHfLaborCost + totalOutsideLaborCost + totalConsumablesCost

    csvContent += "\n"
    const summaryHeaders = ["", "", "", "Summary Category", "Count/Details", "", "Total (₹)", "", ""]
    csvContent += "\n" + summaryHeaders.map(escapeCsvField).join(",")

    const hfSummaryRow = [
      "",
      "",
      "",
      "Total HF Labor",
      `${totalHfLaborCount} laborers`,
      "",
      totalHfLaborCost.toFixed(2),
      "",
      "",
    ]
    csvContent += "\n" + hfSummaryRow.map(escapeCsvField).join(",")
    const outsideSummaryRow = [
      "",
      "",
      "",
      "Total Outside Labor",
      "",
      `${totalOutsideLaborCount} laborers`,
      totalOutsideLaborCost.toFixed(2),
      "",
      "",
    ]
    csvContent += "\n" + outsideSummaryRow.map(escapeCsvField).join(",")
    const consumablesSummaryRow = ["", "", "", "Total Other Expenses", "", "", totalConsumablesCost.toFixed(2), "", ""]
    csvContent += "\n" + consumablesSummaryRow.map(escapeCsvField).join(",")
    const totalRow = ["", "", "", "GRAND TOTAL", "", "", grandTotalForExport.toFixed(2), "", ""]
    csvContent += "\n" + totalRow.map(escapeCsvField).join(",")

    csvContent += "\n\n"
    csvContent += escapeCsvField("Summary by Expenditure Code") + ",,,\n"
    const codeSummaryHeaders = ["Code", "Reference", "Total Expenditure (₹)"]
    csvContent += codeSummaryHeaders.map(escapeCsvField).join(",") + "\n"

    Object.entries(totalsByCode)
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
      .forEach(([code, totalAmount]) => {
        const deployment = deploymentsToExport.find((d) => d.code === code)
        const reference = deployment?.reference || code
        const codeRow = [escapeCsvField(code), escapeCsvField(reference), escapeCsvField(totalAmount.toFixed(2))]
        csvContent += codeRow.join(",") + "\n"
      })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const dateSuffix = exportStartDate && exportEndDate ? `${exportStartDate}_to_${exportEndDate}` : "all_entries"
    link.setAttribute("download", `accounts_summary_${dateSuffix}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportQIF = () => {
    const deploymentsToExport = getFilteredDeploymentsForExport()
    if (!deploymentsToExport) return

    let qifContent = "!Type:Bank\n"

    deploymentsToExport
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((d) => {
        const date = formatDateForQIF(d.date)
        const amount = d.entryType === "Labor" ? d.totalCost : (d as ConsumableDeployment).amount
        const payee = d.reference
        const category = `${d.code} ${d.reference}`

        let memo = ""
        if (d.entryType === "Labor" && d.laborEntries) {
          const hfDetail = d.laborEntries[0]
            ? `HF: ${d.laborEntries[0].laborCount}@${d.laborEntries[0].costPerLabor.toFixed(2)}`
            : ""
          const outsideDetail = d.laborEntries
            .slice(1)
            .map((le, index) => `OS${index + 1}: ${le.laborCount}@${le.costPerLabor.toFixed(2)}`)
            .join("; ")

          let laborDetails = ""
          if (hfDetail && outsideDetail) {
            laborDetails = `${hfDetail}; ${outsideDetail}`
          } else if (hfDetail) {
            laborDetails = hfDetail
          } else if (outsideDetail) {
            laborDetails = outsideDetail
          }

          if (d.notes) {
            memo = laborDetails ? `${laborDetails} | Notes: ${d.notes}` : d.notes
          } else {
            memo = laborDetails
          }
        } else if (d.notes) {
          memo = d.notes
        }

        qifContent += `D${date}\n`
        qifContent += `T-${amount.toFixed(2)}\n`
        qifContent += `P${payee}\n`
        qifContent += `L${category}\n`
        if (memo) qifContent += `M${memo}\n`
        qifContent += "^\n"
      })

    const encodedUri = encodeURI("data:application/qif;charset=utf-8," + qifContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const dateSuffix = exportStartDate && exportEndDate ? `${exportStartDate}_to_${exportEndDate}` : "all_entries"
    link.setAttribute("download", `accounts_export_${dateSuffix}.qif`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${day}/${month}/${year}, ${hours}:${minutes}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Accounts Management</h2>
        <p className="text-muted-foreground">Track labor deployments and expenses by activity code</p>
      </div>

      {isAdmin && combinedDeployments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Combined Accounts Export</CardTitle>
                <CardDescription className="mt-1">
                  Export both labor and other expenses to a single CSV or QIF file.
                </CardDescription>
              </div>
              <div className="text-right flex-shrink-0 pl-4">
                <p className="text-sm font-medium text-muted-foreground">Grand Total</p>
                {laborLoading || consumablesLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>
                        Labor: ₹
                        {laborTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div>
                        Other: ₹
                        {otherExpensesTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-2 flex-wrap">
            <Label htmlFor="exportStartDateCombined" className="text-sm font-medium">
              From:
            </Label>
            <Input
              type="date"
              id="exportStartDateCombined"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="h-9 text-sm"
              aria-label="Combined export start date"
            />
            <Label htmlFor="exportEndDateCombined" className="text-sm font-medium">
              To:
            </Label>
            <Input
              type="date"
              id="exportEndDateCombined"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="h-9 text-sm"
              aria-label="Combined export end date"
            />
            <Button
              onClick={exportCombinedCSV}
              variant="outline"
              size="sm"
              disabled={combinedDeployments.length === 0 || laborLoading || consumablesLoading}
              className="w-full sm:w-auto bg-transparent"
            >
              <FileText className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={exportQIF}
              variant="outline"
              size="sm"
              disabled={combinedDeployments.length === 0 || laborLoading || consumablesLoading}
              className="w-full sm:w-auto bg-transparent"
            >
              <Coins className="mr-2 h-4 w-4" /> Export QIF
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="labor" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Labor Deployments
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" /> Other Expenses
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <List className="h-4 w-4" /> Account Activities
          </TabsTrigger>
        </TabsList>
        <TabsContent value="labor" className="mt-4 space-y-4">
          <LaborDeploymentTab />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4 space-y-4">
          <OtherExpensesTab />
        </TabsContent>
        <TabsContent value="activities" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Activities</CardTitle>
              <CardDescription>All registered account codes and their references</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivities ? (
                <div className="text-center py-8 text-muted-foreground">Loading account activities...</div>
              ) : accountActivities.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Code</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountActivities.map((activity) => (
                        <TableRow key={activity.code}>
                          <TableCell className="font-medium">{activity.code}</TableCell>
                          <TableCell>{activity.reference}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No account activities found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
