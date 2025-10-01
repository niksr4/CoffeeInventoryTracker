"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Table, Columns } from "lucide-react"

interface ColumnInfo {
  column: string
  type: string
  nullable: string
  default: string | null
}

interface DatabaseInfo {
  database_name: string
  tables: string[]
  schema: Record<string, ColumnInfo[]>
  table_count: number
}

interface InspectionResult {
  success: boolean
  databases: {
    inventory_db: DatabaseInfo
    accounts_db: DatabaseInfo
  }
  error?: string
}

export default function InspectDatabasesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InspectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInspect = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/inspect-databases")
      const data = await response.json()

      if (data.success) {
        setResult(data)
        // Log to console for easy copying
        console.log("=== DATABASE INSPECTION RESULTS ===")
        console.log(JSON.stringify(data, null, 2))
      } else {
        setError(data.error || "Failed to inspect databases")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Inspector</h1>
          <p className="text-muted-foreground">View all tables and columns in your Neon databases</p>
        </div>
        <Button onClick={handleInspect} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inspecting...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Inspect Databases
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-6">
          {/* Inventory DB */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {result.databases.inventory_db.database_name}
              </CardTitle>
              <CardDescription>{result.databases.inventory_db.table_count} tables found</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.databases.inventory_db.tables.map((table) => (
                <Card key={table}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      {table}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.databases.inventory_db.schema[table]?.map((col) => (
                        <div key={col.column} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Columns className="h-3 w-3" />
                            <span className="font-mono text-sm">{col.column}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-mono">{col.type}</span>
                            <span>{col.nullable === "YES" ? "nullable" : "not null"}</span>
                            {col.default && <span className="font-mono">default: {col.default}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Accounts DB */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {result.databases.accounts_db.database_name}
              </CardTitle>
              <CardDescription>{result.databases.accounts_db.table_count} tables found</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.databases.accounts_db.tables.map((table) => (
                <Card key={table}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      {table}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.databases.accounts_db.schema[table]?.map((col) => (
                        <div key={col.column} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Columns className="h-3 w-3" />
                            <span className="font-mono text-sm">{col.column}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-mono">{col.type}</span>
                            <span>{col.nullable === "YES" ? "nullable" : "not null"}</span>
                            {col.default && <span className="font-mono">default: {col.default}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Copy to Clipboard */}
          <Alert>
            <AlertDescription>
              Full results have been logged to the browser console. You can copy them from there.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
