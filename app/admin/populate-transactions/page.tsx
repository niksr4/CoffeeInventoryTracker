"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

export default function PopulateTransactionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePopulate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/populate-transactions", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || "Failed to populate transactions")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Populate Transaction History</CardTitle>
          <CardDescription>
            This tool creates initial transaction records for all items currently in your inventory. Run this once to
            populate the transaction history for existing inventory items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handlePopulate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Populating Transactions...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Populate Transactions
              </>
            )}
          </Button>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Success!</h3>
                  <p className="text-sm text-green-700 mt-1">{result.message}</p>
                  {result.result?.count && (
                    <p className="text-sm text-green-600 mt-2">Created {result.result.count} transaction records</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click the "Populate Transactions" button above</li>
              <li>Wait for the process to complete</li>
              <li>Return to the main dashboard to see your transaction history</li>
              <li>You only need to run this once - it will skip if transactions already exist</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
