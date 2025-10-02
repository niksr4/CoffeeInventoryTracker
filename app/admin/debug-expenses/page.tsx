"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugExpensesPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-expenses")
      const data = await response.json()
      setResult(data)
      console.log("Debug result:", data)
    } catch (error) {
      console.error("Error:", error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug Expenses</CardTitle>
          <CardDescription>Check the database state for expenses and activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? "Running..." : "Run Debug Query"}
          </Button>

          {result && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Activities:</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result.activities, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Expense Transactions:</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result.expenses, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Joined Result:</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(result.joined, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
