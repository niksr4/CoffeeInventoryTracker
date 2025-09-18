"use client"

import { useState } from "react"
import { DEMO_TENANTS, DEMO_USERS } from "@/lib/tenant"
import { formatCurrency } from "@/lib/utils"
import { Menu, X, Plus, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function SuperAdminDashboard() {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [showTenantDialog, setShowTenantDialog] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newTenantForm, setNewTenantForm] = useState({
    name: "",
    email: "",
    plan: "starter" as "starter" | "professional" | "enterprise",
  })

  // Calculate platform metrics
  const totalTenants = DEMO_TENANTS.length
  const totalUsers = DEMO_USERS.length
  const totalRevenue = DEMO_TENANTS.reduce((sum, tenant) => {
    const planPrices = { starter: 29, professional: 79, enterprise: 199 }
    return sum + planPrices[tenant.plan]
  }, 0)

  const planDistribution = DEMO_TENANTS.reduce(
    (acc, tenant) => {
      acc[tenant.plan] = (acc[tenant.plan] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const handleCreateTenant = async () => {
    try {
      // In production, this would call your tenant creation API
      console.log("Creating tenant:", newTenantForm)

      alert(`Tenant "${newTenantForm.name}" created successfully`)
      setNewTenantForm({ name: "", email: "", plan: "starter" })
      setShowTenantDialog(false)
    } catch (error) {
      console.error("Failed to create tenant:", error)
    }
  }

  const handleSuspendTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to suspend this tenant?")) return

    try {
      console.log("Suspending tenant:", tenantId)
      alert("Tenant suspended successfully")
    } catch (error) {
      console.error("Failed to suspend tenant:", error)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-balance">Platform Administration</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty">
            Manage all customers and platform operations
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowTenantDialog(true)}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/90 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Create Tenant</span>
            <span className="xs:hidden">Create</span>
          </Button>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Export Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    System Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    View Logs
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</h3>
          <p className="text-lg sm:text-2xl font-bold">{totalTenants}</p>
          <p className="text-xs sm:text-sm text-green-600">+12% from last month</p>
        </div>
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</h3>
          <p className="text-lg sm:text-2xl font-bold">{totalUsers}</p>
          <p className="text-xs sm:text-sm text-green-600">+8% from last month</p>
        </div>
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs sm:text-sm text-green-600">+15% from last month</p>
        </div>
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Revenue/Customer</h3>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue / totalTenants)}</p>
          <p className="text-xs text-muted-foreground">Stable</p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Plan Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(planDistribution).map(([plan, count]) => (
            <div key={plan} className="text-center p-3 sm:p-4 border rounded-lg">
              <p className="text-xl sm:text-2xl font-bold">{count}</p>
              <p className="text-xs sm:text-sm text-muted-foreground capitalize">{plan} Plan</p>
              <p className="text-xs text-muted-foreground">{((count / totalTenants) * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">All Customers ({totalTenants})</h3>
        <div className="space-y-2 sm:space-y-3">
          {DEMO_TENANTS.map((tenant) => {
            const tenantUsers = DEMO_USERS.filter((u) => u.tenantId === tenant.id)
            const planPrices = { starter: 29, professional: 79, enterprise: 199 }

            return (
              <div
                key={tenant.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium">{tenant.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{tenant.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{tenantUsers.length} users</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-sm sm:text-base">{formatCurrency(planPrices[tenant.plan])}/mo</p>
                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">{tenant.plan}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tenant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : tenant.status === "trial"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tenant.status}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTenant(selectedTenant === tenant.id ? null : tenant.id)}
                        className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                      >
                        {selectedTenant === tenant.id ? (
                          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">
                          {selectedTenant === tenant.id ? "Hide" : "Details"}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuspendTenant(tenant.id)}
                        className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 text-red-600 hover:text-red-800"
                      >
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Suspend</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tenant Details */}
      {selectedTenant && (
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Customer Details</h3>
          {(() => {
            const tenant = DEMO_TENANTS.find((t) => t.id === selectedTenant)
            const tenantUsers = DEMO_USERS.filter((u) => u.tenantId === selectedTenant)

            if (!tenant) return null

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Tenant Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p>
                        <span className="text-muted-foreground">Name:</span> {tenant.name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Plan:</span> {tenant.plan}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Status:</span> {tenant.status}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Created:</span> {tenant.createdAt}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Usage Statistics</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p>
                        <span className="text-muted-foreground">Users:</span> {tenantUsers.length}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Inventory Items:</span> 45
                      </p>
                      <p>
                        <span className="text-muted-foreground">Transactions:</span> 128
                      </p>
                      <p>
                        <span className="text-muted-foreground">Last Active:</span> 2 hours ago
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Team Members</h4>
                  <div className="space-y-2">
                    {tenantUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 border rounded text-xs sm:text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs capitalize ml-2 flex-shrink-0">
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {showTenantDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-4 sm:p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Create New Tenant</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTenantDialog(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Farm/Company Name</label>
                <input
                  type="text"
                  value={newTenantForm.name}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                  className="w-full p-2 sm:p-3 border rounded-lg text-sm"
                  placeholder="Green Valley Farm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Admin Email</label>
                <input
                  type="email"
                  value={newTenantForm.email}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, email: e.target.value })}
                  className="w-full p-2 sm:p-3 border rounded-lg text-sm"
                  placeholder="admin@greenvalley.com"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Initial Plan</label>
                <select
                  value={newTenantForm.plan}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, plan: e.target.value as any })}
                  className="w-full p-2 sm:p-3 border rounded-lg text-sm"
                >
                  <option value="starter">Starter - $29/month</option>
                  <option value="professional">Professional - $79/month</option>
                  <option value="enterprise">Enterprise - $199/month</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowTenantDialog(false)}
                className="order-2 sm:order-1 px-4 py-2 border rounded-lg hover:bg-secondary text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTenant}
                className="order-1 sm:order-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
              >
                Create Tenant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
