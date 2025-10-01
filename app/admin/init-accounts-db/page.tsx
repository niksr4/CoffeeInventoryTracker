"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function InitAccountsDbPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleInitialize = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/init-accounts-db", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to initialize database",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Initialize Accounts Database</CardTitle>
          <CardDescription>
            This will create all necessary tables in the accounts_db database including: account_activities,
            labor_deployments, and other_expenses tables with sample data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleInitialize} disabled={loading} size="lg" className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize Accounts Database"
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>{result.message || (result.success ? "Success!" : "Error occurred")}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">This script will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create account_activities table with activity codes</li>
              <li>Create labor_deployments table for labor tracking</li>
              <li>Create other_expenses table for expense tracking</li>
              <li>Add indexes for better query performance</li>
              <li>Insert sample activity codes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
