"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InitRainfallTable() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleInit = async () => {
    setLoading(true)
    setResult("")
    try {
      const response = await fetch("/api/init-rainfall-table")
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Initialize Rainfall Table</CardTitle>
          <CardDescription>Create the rainfall_records table in the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleInit} disabled={loading}>
            {loading ? "Initializing..." : "Initialize Rainfall Table"}
          </Button>
          {result && <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">{result}</pre>}
        </CardContent>
      </Card>
    </div>
  )
}
