"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Plus, TrendingUp, DollarSign, PlusCircle, Users, BarChart3, FileText } from "lucide-react"

interface DashboardProps {
  setActiveTab: (tab: string) => void
}

const Dashboard = ({ setActiveTab }: DashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
          onClick={() => setActiveTab("inventory")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Management</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-3 w-3" />
                Add New Item
              </Button>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <TrendingUp className="mr-2 h-3 w-3" />
                Record Transaction
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-purple-200"
          onClick={() => setActiveTab("accounts")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Management</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                <PlusCircle className="mr-2 h-3 w-3" />
                Add Category
              </Button>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <Users className="mr-2 h-3 w-3" />
                Add Labor Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-blue-200"
          onClick={() => setActiveTab("analytics")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics & Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                <BarChart3 className="mr-2 h-3 w-3" />
                View Analytics
              </Button>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <FileText className="mr-2 h-3 w-3" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-amber-600">24</div>
              <p className="text-xs text-muted-foreground">Active Items</p>
              <div className="text-sm text-muted-foreground">Last updated: Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Getting Started - Quick Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">1. Set Up Your Inventory</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Click "Add New Item" to add your products</li>
                <li>• Choose appropriate units (kg, L, bags, etc.)</li>
                <li>• Set initial quantities for existing stock</li>
                <li>• Use descriptive names for easy identification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">2. Configure Expense Categories</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Go to Accounts → Add Category</li>
                <li>• Create categories specific to your business</li>
                <li>• Use numeric codes (600+) for custom categories</li>
                <li>• Categories work for both labor and expenses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">3. Record Your First Transactions</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Use "Restock" for incoming inventory</li>
                <li>• Use "Deplete" for items used/sold</li>
                <li>• Add notes for better tracking</li>
                <li>• All changes are automatically logged</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">4. Manage Labor & Expenses</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Record daily labor deployments</li>
                <li>• Track consumable expenses</li>
                <li>• Export data for accounting</li>
                <li>• View comprehensive reports</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
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
