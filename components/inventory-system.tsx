"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Package,
  TrendingUp,
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Activity,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function InventorySystem() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")

  const mockInventory = [
    { name: "Green Coffee Beans", quantity: 500, unit: "kg", value: 25000 },
    { name: "Roasted Coffee Beans", quantity: 150, unit: "kg", value: 22500 },
    { name: "Coffee Fertilizer", quantity: 100, unit: "kg", value: 5000 },
    { name: "Pesticides", quantity: 25, unit: "L", value: 7500 },
    { name: "Harvesting Tools", quantity: 15, unit: "pcs", value: 12000 },
    { name: "Processing Equipment", quantity: 3, unit: "pcs", value: 150000 },
  ]

  const mockTransactions = [
    { id: "1", item: "Green Coffee Beans", type: "Harvest", quantity: 200, date: "2024-01-15", user: "Farm Manager" },
    {
      id: "2",
      item: "Roasted Coffee Beans",
      type: "Processing",
      quantity: 50,
      date: "2024-01-14",
      user: "Processing Team",
    },
    { id: "3", item: "Coffee Fertilizer", type: "Application", quantity: 20, date: "2024-01-13", user: "Field Worker" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">FarmTrack Pro</h1>
          <p className="text-muted-foreground">Comprehensive Farm Management System - Optimized for Coffee Farms</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-11">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            <TabsTrigger value="farmflow">FarmFlow</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="mapping">Farm Map</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="monitoring">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockInventory.length}</div>
                  <p className="text-xs text-muted-foreground">Active inventory items</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{mockInventory.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Current inventory value</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockTransactions.length}</div>
                  <p className="text-xs text-muted-foreground">Transactions today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">Items need restocking</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest farm operations and inventory movements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{transaction.item}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.date} • {transaction.user}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={transaction.type === "Harvest" ? "default" : "secondary"}>
                          {transaction.type}
                        </Badge>
                        <span className="font-medium">{transaction.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Inventory Management
                </CardTitle>
                <CardDescription>Manage your coffee farm inventory and supplies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-6">
                  <Search className="h-4 w-4 text-amber-600" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm border-amber-200 focus:border-amber-400"
                  />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <div className="text-sm text-amber-800 mb-1">Total Items</div>
                    <div className="text-2xl font-bold">{mockInventory.length}</div>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <div className="text-sm text-amber-800 mb-1">Total Value</div>
                    <div className="text-2xl font-bold">
                      ₹{mockInventory.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <div className="text-sm text-amber-800 mb-1">Low Stock Items</div>
                    <div className="text-2xl font-bold">
                      {mockInventory.filter((item) => item.quantity < 30).length}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {mockInventory
                    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item, index) => (
                      <Card key={index} className="border-amber-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-amber-800">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} {item.unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-amber-800">₹{item.value.toLocaleString()}</p>
                              <Badge
                                variant={item.quantity < 30 ? "destructive" : "outline"}
                                className={item.quantity >= 30 ? "bg-amber-100 text-amber-800 border-amber-300" : ""}
                              >
                                {item.quantity < 30 ? "Low Stock" : "In Stock"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all inventory transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{transaction.item}</h3>
                        <p className="text-sm text-muted-foreground">
                          {transaction.date} • {transaction.user}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={transaction.type === "Harvest" ? "default" : "secondary"}>
                          {transaction.type}
                        </Badge>
                        <span className="font-medium">{transaction.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Account Management
                </CardTitle>
                <CardDescription>Manage user accounts and permissions for your coffee farm</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <div className="text-sm text-amber-800 mb-1">Total Users</div>
                    <div className="text-2xl font-bold">12</div>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <div className="text-sm text-amber-800 mb-1">Active Sessions</div>
                    <div className="text-2xl font-bold">8</div>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-lg">
                    <div className="text-sm text-amber-800 mb-1">Admin Users</div>
                    <div className="text-2xl font-bold">3</div>
                  </div>
                </div>

                {/* Sample User Cards */}
                <div className="space-y-4">
                  {[
                    { name: "Farm Manager", email: "manager@coffeefarm.com", role: "Administrator", status: "Active" },
                    {
                      name: "Field Supervisor",
                      email: "supervisor@coffeefarm.com",
                      role: "Supervisor",
                      status: "Active",
                    },
                    { name: "Inventory Clerk", email: "clerk@coffeefarm.com", role: "User", status: "Active" },
                    { name: "Quality Inspector", email: "inspector@coffeefarm.com", role: "User", status: "Inactive" },
                  ].map((user, index) => (
                    <Card key={index} className="border-amber-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-amber-800">{user.name}</h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <div>
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 mb-1">
                                {user.role}
                              </Badge>
                              <div>
                                <Badge
                                  variant={user.status === "Active" ? "default" : "secondary"}
                                  className={user.status === "Active" ? "bg-green-100 text-green-800" : ""}
                                >
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent"
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mt-6">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weather Information</CardTitle>
                <CardDescription>Current weather conditions for your farm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Weather Dashboard</h3>
                    <p className="text-muted-foreground">Weather information will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>Intelligent insights for your farm operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">AI Insights</h3>
                    <p className="text-muted-foreground">AI-powered analysis will be available here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="farmflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>FarmFlow Dashboard</CardTitle>
                <CardDescription>Streamlined farm operations management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">FarmFlow System</h3>
                    <p className="text-muted-foreground">Advanced farm management features coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Planning</CardTitle>
                <CardDescription>Plan and track farm tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Task Management</h3>
                    <p className="text-muted-foreground">Task planning features will be available here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Farm Mapping</CardTitle>
                <CardDescription>Visual farm layout and coffee plantation areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Farm Map</h3>
                    <p className="text-muted-foreground">Interactive farm mapping will be available here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hr" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>HR Management</CardTitle>
                <CardDescription>Manage farm workers and schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Human Resources</h3>
                    <p className="text-muted-foreground">HR management features will be available here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Modules</CardTitle>
                <CardDescription>Educational resources for coffee farming and best practices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Educational Training</h3>
                    <p className="text-muted-foreground">Coffee farming training modules will be available here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Monitoring</CardTitle>
                <CardDescription>Monitor plantation conditions and environmental sensors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Live Monitoring</h3>
                    <p className="text-muted-foreground">Real-time plantation sensor data will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
