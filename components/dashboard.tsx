"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Plus, TrendingUp, DollarSign, PlusCircle, Users, BarChart3, FileText, Download } from "lucide-react"
import { DataImportExport } from "./data-import-export"

interface DashboardProps {
  setActiveTab: (tab: string) => void
}

const Dashboard = ({ setActiveTab }: DashboardProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
          onClick={() => setActiveTab("inventory")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Inventory Management</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-8 sm:h-9">
                <Plus className="mr-1 sm:mr-2 h-3 w-3" />
                Add New Item
              </Button>
              <Button size="sm" variant="outline" className="w-full bg-transparent text-xs sm:text-sm h-8 sm:h-9">
                <TrendingUp className="mr-1 sm:mr-2 h-3 w-3" />
                Record Transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-purple-200"
          onClick={() => setActiveTab("accounts")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Account Management</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm h-8 sm:h-9">
                <PlusCircle className="mr-1 sm:mr-2 h-3 w-3" />
                Add Category
              </Button>
              <Button size="sm" variant="outline" className="w-full bg-transparent text-xs sm:text-sm h-8 sm:h-9">
                <Users className="mr-1 sm:mr-2 h-3 w-3" />
                Add Labor Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-blue-200"
          onClick={() => setActiveTab("analytics")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Analytics & Reports</CardTitle>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8 sm:h-9">
                <BarChart3 className="mr-1 sm:mr-2 h-3 w-3" />
                View Analytics
              </Button>
              <Button size="sm" variant="outline" className="w-full bg-transparent text-xs sm:text-sm h-8 sm:h-9">
                <FileText className="mr-1 sm:mr-2 h-3 w-3" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Quick Stats</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">24</div>
              <p className="text-xs text-muted-foreground">Active Items</p>
              <div className="text-xs text-muted-foreground">Last updated: Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-indigo-800 flex items-center text-sm sm:text-base">
            <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Data Import & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <DataImportExport />
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-blue-800 flex items-center text-sm sm:text-base">
            <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Getting Started - Quick Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">1. Set Up Your Inventory</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-blue-700">
                <li>• Click "Add New Item" to add your products</li>
                <li>• Choose appropriate units (kg, L, bags, etc.)</li>
                <li>• Set initial quantities for existing stock</li>
                <li>• Use descriptive names for easy identification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">2. Configure Expense Categories</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-blue-700">
                <li>• Go to Accounts → Add Category</li>
                <li>• Create categories specific to your business</li>
                <li>• Use numeric codes (600+) for custom categories</li>
                <li>• Categories work for both labor and expenses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">
                3. Record Your First Transactions
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm text-blue-700">
                <li>• Use "Restock" for incoming inventory</li>
                <li>• Use "Deplete" for items used/sold</li>
                <li>• Add notes for better tracking</li>
                <li>• All changes are automatically logged</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">4. Manage Labor & Expenses</h4>
              <ul className="space-y-1 text-xs sm:text-sm text-blue-700">
                <li>• Record daily labor deployments</li>
                <li>• Track consumable expenses</li>
                <li>• Export data for accounting</li>
                <li>• View comprehensive reports</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Pro Tip:</strong> Start by adding 5-10 of your most common inventory items and expense categories.
              You can always add more later as needed!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
