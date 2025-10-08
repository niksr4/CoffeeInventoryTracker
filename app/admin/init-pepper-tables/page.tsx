"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react"

export default function InitPepperTablesPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    tables?: Record<string, boolean>
  } | null>(null)

  const checkTables = async () => {
    setChecking(true)
    setResult(null)
    try {
      const response = await fetch("/api/init-pepper-tables")
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Failed to check tables",
      })
    } finally {
      setChecking(false)
    }
  }

  const initializeTables = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch("/api/init-pepper-tables", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Refresh table status after creation
        setTimeout(checkTables, 1000)
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Failed to initialize tables",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Initialize Pepper Tables
          </CardTitle>
          <CardDescription>
            Create the pepper tracking tables (pg_pepper, hf_pepper, mv_pepper) in the processing_db database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkTables} disabled={checking} variant="outline">
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Tables
            </Button>
            <Button onClick={initializeTables} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tables
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>{result.message || result.error || "Operation completed"}</AlertDescription>
                  </div>
                </div>
              </Alert>

              {result.tables && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Table Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(result.tables).map(([tableName, exists]) => (
                        <div key={tableName} className="flex items-center justify-between p-2 rounded border">
                          <span className="font-mono text-sm">{tableName}</span>
                          <div className="flex items-center gap-2">
                            {exists ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">Exists</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Not found</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="font-semibold">What this does:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Creates three pepper tracking tables in processing_db</li>
              <li>Each table tracks: date, kg picked, green pepper, dry pepper, and percentages</li>
              <li>Tables: pg_pepper (PG location), hf_pepper (HF location), mv_pepper (MV location)</li>
              <li>Adds indexes for efficient date-based queries</li>
              <li>Safe to run multiple times (uses IF NOT EXISTS)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
