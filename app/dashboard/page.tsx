import InventorySystem from "@/components/inventory-system"
import { Header } from "@/components/header"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        <InventorySystem />
      </main>
    </div>
  )
}
