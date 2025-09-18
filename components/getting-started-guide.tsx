import { Card, CardHeader, CardTitle, CardContent } from "your-ui-library"
import Info from "path-to-info-icon"

export default function GettingStartedGuide() {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center">
          <Info className="mr-2 h-5 w-5" />
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
  )
}
