"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function InitDbPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleInit = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/init-databases", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to initialize databases",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Initialize Database Tables</CardTitle>
          <CardDescription>
            This will create all necessary tables in both inventory_db and accounts_db. It's safe to run multiple times.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleInit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize Database Tables"
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="font-semibold">{result.message}</div>
                {result.details && (
                  <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(result.details, null, 2)}</pre>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">This will create:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>current_inventory - Stores current inventory levels</li>
              <li>transaction_history - Tracks all inventory transactions</li>
              <li>inventory_summary - Aggregated inventory statistics</li>
              <li>labor_deployments - Employee labor tracking</li>
              <li>other_expenses - General expense tracking</li>
              <li>consumables - Consumable items tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
