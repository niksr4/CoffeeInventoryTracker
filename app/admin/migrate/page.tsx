"use client"
import { DataMigration } from "@/components/data-migration"

export default function MigratePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">Data Migration Tool</h1>
      <DataMigration />
    </div>
  )
}
