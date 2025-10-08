"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2, Database } from "lucide-react"

interface TableStatus {
  [key: string]: {
    exists: boolean
    count: number
  }
}

export default function CreateLocationTablesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkTables = async () => {
    setIsChecking(true)
    setError(null)
    try {
      const response = await fetch("/api/create-location-tables")
      const data = await response.json()

      if (data.success) {
        setTableStatus(data.tables)
      } else {
        setError(data.error || "Failed to check tables")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }

  const runMigration = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/create-location-tables", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Refresh table status after migration
        await checkTables()
      } else {
        setError(data.error || "Migration failed")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Create Location Tables
          </CardTitle>
          <CardDescription>
            This will rename the existing processing_records table to hf_arabica and create three additional tables for
            different locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && result.success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={checkTables} disabled={isChecking} variant="outline">
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Table Status"
                )}
              </Button>

              <Button onClick={runMigration} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Tables...
                  </>
                ) : (
                  "Create Location Tables"
                )}
              </Button>
            </div>

            {tableStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Table Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(tableStatus).map(([table, status]) => (
                      <div key={table} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          {status.exists ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-mono font-medium">{table}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {status.exists ? `${status.count} records` : "Does not exist"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>What this migration does:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Renames existing processing_records table to hf_arabica (preserves all your data)</li>
              <li>Creates hf_robusta table (empty)</li>
              <li>Creates mv_robusta table (empty)</li>
              <li>Creates pg_robusta table (empty)</li>
              <li>Adds indexes on process_date for all tables for faster queries</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
