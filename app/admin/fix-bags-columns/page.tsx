"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function FixBagsColumnsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/fix-bags-columns")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Failed to run migration")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Fix Bags and Percentage Columns</h1>

      <Card>
        <CardHeader>
          <CardTitle>Schema Migration</CardTitle>
          <CardDescription>
            This will update the bags columns from INTEGER to DECIMAL(10, 2) and expand percentage fields to DECIMAL(10,
            2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
              <h3 className="font-semibold flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Warning
              </h3>
              <p className="mt-2">
                Running this migration will modify the database schema. This will allow decimal values for bags (e.g.,
                2.4 bags) and fix percentage fields. Ensure you have a backup before proceeding.
              </p>
            </div>

            <Button onClick={runMigration} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Migration...
                </>
              ) : (
                "Run Migration"
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 text-red-800 rounded-md">
                <h3 className="font-semibold flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Error
                </h3>
                <p className="mt-2">{error}</p>
              </div>
            )}

            {results && (
              <div className="p-4 bg-green-50 text-green-800 rounded-md">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Migration Successful
                </h3>
                <p className="mt-2">{results.message}</p>

                {results.columnInfo && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Updated Columns</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 border">Column</th>
                            <th className="p-2 border">Type</th>
                            <th className="p-2 border">Precision</th>
                            <th className="p-2 border">Scale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.columnInfo.map((col: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="p-2 border">{col.column_name}</td>
                              <td className="p-2 border">{col.data_type}</td>
                              <td className="p-2 border">{col.numeric_precision || "-"}</td>
                              <td className="p-2 border">{col.numeric_scale || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
