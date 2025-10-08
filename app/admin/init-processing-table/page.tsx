"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react"

export default function InitProcessingTablePage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInitialize = async () => {
    setIsInitializing(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/init-processing-table", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to initialize processing table")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsInitializing(false)
    }
  }

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/init-processing-table")
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Failed to check status")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Initialize Processing Database
          </CardTitle>
          <CardDescription>Create the processing_records table in the processing_db database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleInitialize} disabled={isInitializing}>
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Processing Table
                </>
              )}
            </Button>
            <Button variant="outline" onClick={checkStatus}>
              Check Status
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && result.success && (
            <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">Success</p>
                <p className="text-green-700 text-sm">{result.message}</p>
                {result.database && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Database:</strong> {result.database}
                    </p>
                    {result.columns && (
                      <p>
                        <strong>Columns:</strong> {result.columns}
                      </p>
                    )}
                    {result.recordCount !== undefined && (
                      <p>
                        <strong>Records:</strong> {result.recordCount}
                      </p>
                    )}
                    {result.tableExists !== undefined && (
                      <p>
                        <strong>Table Exists:</strong> {result.tableExists ? "Yes" : "No"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {result && result.tableStructure && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Table Structure</h3>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Column</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tableStructure.map((col: any) => (
                      <tr key={col.column_name} className="border-b">
                        <td className="py-1">{col.column_name}</td>
                        <td className="py-1">{col.data_type}</td>
                        <td className="py-1">{col.is_nullable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
