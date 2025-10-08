"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function TestProcessingDbPage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [insertResults, setInsertResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-processing-db")
      const data = await response.json()
      setTestResults(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while testing the database")
    } finally {
      setLoading(false)
    }
  }

  const insertTestRecord = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-processing-db", {
        method: "POST",
      })
      const data = await response.json()
      setInsertResults(data)
    } catch (err: any) {
      setError(err.message || "An error occurred while inserting test record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Test Processing Database</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
            <CardDescription>Test the connection to the processing database and check the table schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runTests} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Database Tests
              </Button>

              {error && <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>}

              {testResults && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-semibold mb-2">Test Results</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Connection:</strong> {testResults.success ? "Success" : "Failed"}
                    </p>
                    <p>
                      <strong>Table Exists:</strong> {testResults.tableExists ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Record Count:</strong> {testResults.recordCount}
                    </p>
                    <p>
                      <strong>Timestamp:</strong> {testResults.timestamp}
                    </p>

                    {testResults.columnInfo && (
                      <div>
                        <h4 className="font-semibold mt-4 mb-2">Column Information</h4>
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
                              {testResults.columnInfo.map((col: any, i: number) => (
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

                    {testResults.sampleRecord && (
                      <div>
                        <h4 className="font-semibold mt-4 mb-2">Sample Record</h4>
                        <pre className="p-2 bg-gray-100 overflow-x-auto rounded text-sm">
                          {JSON.stringify(testResults.sampleRecord, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={insertTestRecord} disabled={loading || !testResults?.tableExists} variant="outline">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Insert Test Record
            </Button>
          </CardFooter>
        </Card>

        {insertResults && (
          <Card>
            <CardHeader>
              <CardTitle>Test Record Insertion</CardTitle>
              <CardDescription>Results from inserting a test record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Insert Results</h3>
                <p>
                  <strong>Success:</strong> {insertResults.success ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Message:</strong> {insertResults.message || insertResults.error}
                </p>
                <p>
                  <strong>Timestamp:</strong> {insertResults.timestamp}
                </p>

                {insertResults.testRecord && (
                  <div>
                    <h4 className="font-semibold mt-4 mb-2">Inserted Record</h4>
                    <pre className="p-2 bg-gray-100 overflow-x-auto rounded text-sm">
                      {JSON.stringify(insertResults.testRecord, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
