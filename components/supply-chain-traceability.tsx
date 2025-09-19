"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, CheckCircle, BarChart3, Search } from "lucide-react"
import BatchManagement from "./batch-management"
import QualityControl from "./quality-control"
import BatchTracking from "./batch-tracking"
import TraceabilityDashboard from "./traceability-dashboard"

export default function SupplyChainTraceability() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supply Chain Traceability</h1>
        <p className="text-muted-foreground">
          Complete end-to-end tracking from hive to customer with quality control and compliance reporting
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Batches</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Quality</span>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <TraceabilityDashboard />
        </TabsContent>

        <TabsContent value="batches">
          <BatchManagement />
        </TabsContent>

        <TabsContent value="quality">
          <QualityControl />
        </TabsContent>

        <TabsContent value="tracking">
          <BatchTracking />
        </TabsContent>
      </Tabs>
    </div>
  )
}
