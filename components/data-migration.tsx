"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState("")
  const { toast } = useToast()

  const handleMigration = async () => {
    setIsMigrating(true)
    setMigrationStatus("Starting data migration...")
    try {
      const response = await fetch("/api/migrate-data", {
        method: "POST",
      })
      const result = await response.json()

      if (response.ok) {
        setMigrationStatus(`Migration successful: ${result.message}`)
        toast({
          title: "Success",
          description: "Data migration completed successfully.",
        })
      } else {
        throw new Error(result.error || "Unknown error during migration")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      setMigrationStatus(`Migration failed: ${errorMessage}`)
      toast({
        title: "Error",
        description: `Data migration failed: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Migration</CardTitle>
        <CardDescription>Run the data migration script to populate the database with initial data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4">
          <Button onClick={handleMigration} disabled={isMigrating}>
            {isMigrating ? "Migrating..." : "Start Migration"}
          </Button>
          {migrationStatus && <p className="text-sm text-muted-foreground">{migrationStatus}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
