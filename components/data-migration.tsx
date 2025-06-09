"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Database, ArrowRight } from "lucide-react"

export default function DataMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<"default" | "api">("default")
  const [forceOverwrite, setForceOverwrite] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/migrate-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          force: forceOverwrite,
          source,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Migration Successful",
          description: `${data.transactionsCount} items migrated to Redis database.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Migration Skipped",
          description: data.message,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: "There was an error migrating data. Check console for details.",
        variant: "destructive",
      })
      setResult({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/redis-test")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Redis database.",
          variant: "default",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Could not connect to Redis database.",
          variant: "destructive",
        })
      }
      setResult(data)
    } catch (error) {
      console.error("Connection test error:", error)
      toast({
        title: "Connection Test Failed",
        description: "There was an error testing the connection. Check console for details.",
        variant: "destructive",
      })
      setResult({ success: false, error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-green-700">Data Migration Utility</CardTitle>
        <CardDescription>Migrate your inventory data to the Upstash Redis database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-2 block">Data Source</Label>
          <RadioGroup
            value={source}
            onValueChange={(value: "default" | "api") => setSource(value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="default" />
              <Label htmlFor="default">Use default inventory items</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="api" id="api" />
              <Label htmlFor="api">Fetch from current API (must be running locally)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="force"
            checked={forceOverwrite}
            onCheckedChange={(checked) => setForceOverwrite(checked === true)}
          />
          <Label
            htmlFor="force"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Force overwrite existing data
          </Label>
        </div>

        {result && (
          <div
            className={`p-3 rounded-md text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}
          >
            <p className="font-medium">{result.message}</p>
            {result.transactionsCount && <p>Transactions: {result.transactionsCount}</p>}
            {result.existingCount && <p>Existing records: {result.existingCount}</p>}
            {result.error && <p className="text-red-600 mt-1">{result.error}</p>}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={handleTestConnection} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
          Test Connection
        </Button>
        <Button
          onClick={handleMigration}
          disabled={isLoading}
          className="w-full sm:w-auto bg-green-700 hover:bg-green-800"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
          Migrate Data
        </Button>
      </CardFooter>
    </Card>
  )
}
