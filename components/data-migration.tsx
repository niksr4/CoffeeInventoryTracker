"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader } from "lucide-react"

export const DataMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState("idle") // idle, migrating, success, error
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")

  const handleMigrate = async () => {
    setMigrationStatus("migrating")
    setMessage("Starting data migration...")
    setProgress(10)

    try {
      const response = await fetch("/api/migrate-data", {
        method: "POST",
      })

      setProgress(50)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Migration failed with an unknown error.")
      }

      const result = await response.json()
      setProgress(100)
      setMigrationStatus("success")
      setMessage(result.message || "Data migration completed successfully!")
    } catch (error: any) {
      setMigrationStatus("error")
      setMessage(error.message || "An unexpected error occurred during migration.")
      setProgress(100) // Show full bar on error for clarity
    }
  }

  const renderStatusIcon = () => {
    switch (migrationStatus) {
      case "migrating":
        return <Loader className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Data Migration Utility</CardTitle>
        <CardDescription>
          Transfer legacy inventory data to the new storage system. This process cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleMigrate} disabled={migrationStatus === "migrating"} className="w-full">
          {migrationStatus === "migrating" ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Migrating...
            </>
          ) : (
            "Start Migration"
          )}
        </Button>
        {migrationStatus !== "idle" && (
          <div className="space-y-2">
            <Progress value={progress} className={migrationStatus === "error" ? "bg-red-500/20" : ""} />
            <Alert
              variant={
                migrationStatus === "error" ? "destructive" : migrationStatus === "success" ? "default" : "default"
              }
              className={migrationStatus === "success" ? "border-green-500/50 text-green-500" : ""}
            >
              <div className="flex items-center gap-2">
                {renderStatusIcon()}
                <AlertDescription>{message}</AlertDescription>
              </div>
            </Alert>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Please ensure you have a backup before proceeding.</p>
      </CardFooter>
    </Card>
  )
}
