import DataMigration from "@/components/data-migration"

export default function MigrationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-green-700">Database Migration Tool</h1>
      <DataMigration />
    </div>
  )
}
