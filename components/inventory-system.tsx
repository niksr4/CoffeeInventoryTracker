"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Plus,
  Coffee,
  Sparkles,
  Zap,
  BarChart3,
  Cloud,
  Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import InventoryTracker from "@/components/inventory-tracker"
import WeatherTab from "@/components/weather-tab"
import AiAnalysisCharts from "@/components/ai-analysis-charts"

export default function InventorySystem() {
  const [activeTab, setActiveTab] = useState("dashboard")

  const emptyInventory: any[] = []
  const emptyTransactions: any[] = []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-200/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-200/10 to-transparent rounded-full blur-3xl"></div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Coffee className="h-12 w-12 text-emerald-600 animate-pulse" />
              <Sparkles className="h-6 w-6 text-emerald-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-800 bg-clip-text text-transparent mb-2">
            FarmTrack Pro
          </h1>
          <p className="text-lg text-slate-600 font-medium">Next-Generation Farm Management System</p>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-500 mx-auto mt-4 rounded-full"></div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 bg-white/80 backdrop-blur-sm border border-emerald-200/50 shadow-lg rounded-xl p-2">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <Users className="h-4 w-4 mr-2" />
              Accounts
            </TabsTrigger>
            <TabsTrigger
              value="weather"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <Cloud className="h-4 w-4 mr-2" />
              Weather
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Total Items",
                  value: "0",
                  subtitle: "Ready for your inventory",
                  icon: Package,
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  title: "Total Value",
                  value: "₹0",
                  subtitle: "Awaiting first entries",
                  icon: TrendingUp,
                  color: "from-emerald-500 to-teal-500",
                },
                {
                  title: "Recent Activity",
                  value: "0",
                  subtitle: "No transactions yet",
                  icon: Activity,
                  color: "from-purple-500 to-violet-500",
                },
                {
                  title: "System Status",
                  value: "Ready",
                  subtitle: "All systems operational",
                  icon: Zap,
                  color: "from-emerald-500 to-green-500",
                },
              ].map((card, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-slate-700">{card.title}</CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} shadow-lg`}>
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-slate-800 mb-1">{card.value}</div>
                    <p className="text-xs text-slate-500">{card.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-emerald-800">Welcome to FarmTrack Pro</CardTitle>
                    <CardDescription className="text-emerald-700">
                      Your comprehensive coffee farm management system is ready to use
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                    <Package className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <h3 className="font-medium text-emerald-800 mb-1">Inventory Management</h3>
                    <p className="text-sm text-emerald-700">Track your coffee beans, supplies, and equipment</p>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                    <Brain className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <h3 className="font-medium text-emerald-800 mb-1">AI Insights</h3>
                    <p className="text-sm text-emerald-700">Get intelligent recommendations for your farm</p>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                    <Cloud className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <h3 className="font-medium text-emerald-800 mb-1">Weather Monitoring</h3>
                    <p className="text-sm text-emerald-700">Stay updated with local weather conditions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 mt-8">
            <InventoryTracker />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6 mt-8">
            <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-emerald-200/50 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-200/10 to-transparent rounded-full blur-3xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-emerald-800 flex items-center text-xl">
                  <Users className="h-6 w-6 mr-3 p-1 bg-emerald-100 rounded" />
                  Account Management
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Manage user accounts and permissions for your coffee farm
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  {[
                    { title: "Total Users", value: "0", subtitle: "Ready to add team members" },
                    { title: "Active Sessions", value: "1", subtitle: "You are currently logged in" },
                    { title: "Admin Users", value: "1", subtitle: "Primary administrator account" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="text-sm text-emerald-700 mb-2 font-medium">{stat.title}</div>
                      <div className="text-3xl font-bold text-emerald-800 mb-1">{stat.value}</div>
                      <div className="text-xs text-emerald-600">{stat.subtitle}</div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl border border-emerald-200/30">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Team Members Yet</h3>
                  <p className="text-emerald-700 mb-6 max-w-md mx-auto">
                    Start building your farm management team by adding users with different roles and permissions.
                  </p>
                  <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Team Member
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="space-y-6 mt-8">
            <WeatherTab />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-8">
            <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-purple-200/50 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-200/10 to-transparent rounded-full blur-3xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-purple-800 flex items-center text-xl">
                  <Brain className="h-6 w-6 mr-3 p-1 bg-purple-100 rounded" />
                  AI Analysis Dashboard
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Intelligent insights and recommendations for your coffee farm operations
                </CardDescription>
              </CardHeader>
            </Card>
            <AiAnalysisCharts inventory={emptyInventory} transactions={emptyTransactions} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6 mt-8">
            <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-emerald-200/50 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-200/10 to-transparent rounded-full blur-3xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-emerald-800 flex items-center text-xl">
                  <Calendar className="h-6 w-6 mr-3 p-1 bg-emerald-100 rounded" />
                  Task Planning System
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Plan, schedule, and track all your coffee farm operations
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl border border-emerald-200/30">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-800 mb-3">Task Management Ready</h3>
                  <p className="text-emerald-700 mb-8 max-w-lg mx-auto">
                    Organize your coffee farm operations with intelligent task scheduling, progress tracking, and team
                    coordination.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Calendar className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-medium text-emerald-800 mb-1">Schedule Tasks</h4>
                      <p className="text-sm text-emerald-700">Plan harvesting, processing, and maintenance</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Users className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-medium text-emerald-800 mb-1">Assign Teams</h4>
                      <p className="text-sm text-emerald-700">Coordinate worker assignments and shifts</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Activity className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-medium text-emerald-800 mb-1">Track Progress</h4>
                      <p className="text-sm text-emerald-700">Monitor completion and productivity</p>
                    </div>
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
