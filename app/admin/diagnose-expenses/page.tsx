"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DiagnoseExpensesPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnosis = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnose-expenses")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error running diagnosis:", error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Diagnose Expense References</CardTitle>
          <CardDescription>Check why references are not matching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnosis} disabled={loading}>
            {loading ? "Running..." : "Run Diagnosis"}
          </Button>

          {result && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Expense Codes Check:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(result.expenseCheck, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-bold mb-2">Activity Codes Check:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(result.activityCheck, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-bold mb-2">Join Test (Should show MATCHED):</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(result.joinTest, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
