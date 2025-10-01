"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function FixTriggerPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFix = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-trigger", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to fix trigger",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fix Inventory Trigger</CardTitle>
          <CardDescription>
            This will update your database trigger to use UPSERT instead of INSERT, fixing the duplicate key error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">What this does:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Drops the existing trigger and function</li>
                  <li>Creates a new function that uses UPSERT (INSERT ... ON CONFLICT)</li>
                  <li>Recreates the trigger with the improved function</li>
                </ul>
              </div>
            </div>
          </div>

          <Button onClick={handleFix} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Trigger...
              </>
            ) : (
              "Fix Trigger Now"
            )}
          </Button>

          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                    {result.success ? "Success!" : "Error"}
                  </p>
                  <p className={`text-sm mt-1 ${result.success ? "text-green-700" : "text-red-700"}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
