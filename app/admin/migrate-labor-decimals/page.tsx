"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function MigrateLaborDecimalsPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const runMigration = async () => {
    setStatus("loading")
    setMessage("Running migration...")

    try {
      const response = await fetch("/api/migrate-labor-decimals", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message || "Migration completed successfully!")
      } else {
        setStatus("error")
        setMessage(data.error || "Migration failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unknown error occurred")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Migrate Labor Columns to Decimal</CardTitle>
          <CardDescription>
            This migration updates the labor_transactions table to support decimal labor counts (e.g., 2.5 for half-day
            labor)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">This migration will:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Change hf_laborers column from INTEGER to DECIMAL(10,2)</li>
              <li>Change outside_laborers column from INTEGER to DECIMAL(10,2)</li>
              <li>Preserve all existing data</li>
            </ul>
          </div>

          <Button onClick={runMigration} disabled={status === "loading"}>
            {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Migration
          </Button>

          {status === "success" && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
