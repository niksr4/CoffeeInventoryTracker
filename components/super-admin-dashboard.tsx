"use client"

import { useState } from "react"
import { DEMO_TENANTS, DEMO_USERS } from "@/lib/tenant"
import { formatCurrency } from "@/lib/utils"

export default function SuperAdminDashboard() {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [showTenantDialog, setShowTenantDialog] = useState(false)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Administration</h1>
          <p className="text-muted-foreground">Manage all customers and platform operations</p>
        </div>
        <button
          onClick={() => setShowTenantDialog(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Create Tenant
        </button>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Customers</h3>
          <p className="text-2xl font-bold">{totalTenants}</p>
          <p className="text-sm text-green-600">+12% from last month</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-sm text-green-600">+8% from last month</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-green-600">+15% from last month</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Avg Revenue/Customer</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue / totalTenants)}</p>
          <p className="text-sm text-blue-600">Stable</p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Plan Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(planDistribution).map(([plan, count]) => (
            <div key={plan} className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground capitalize">{plan} Plan</p>
              <p className="text-xs text-muted-foreground">{((count / totalTenants) * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">All Customers ({totalTenants})</h3>
        <div className="space-y-3">
          {DEMO_TENANTS.map((tenant) => {
            const tenantUsers = DEMO_USERS.filter((u) => u.tenantId === tenant.id)
            const planPrices = { starter: 29, professional: 79, enterprise: 199 }

            return (
              <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{tenant.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">{tenantUsers.length} users</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(planPrices[tenant.plan])}/mo</p>
                    <p className="text-sm text-muted-foreground capitalize">{tenant.plan}</p>
                  </div>
                  <div className="flex items-center space-x-2">
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
                    <button
                      onClick={() => setSelectedTenant(selectedTenant === tenant.id ? null : tenant.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {selectedTenant === tenant.id ? "Hide" : "Details"}
                    </button>
                    <button
                      onClick={() => handleSuspendTenant(tenant.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tenant Details */}
      {selectedTenant && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
          {(() => {
            const tenant = DEMO_TENANTS.find((t) => t.id === selectedTenant)
            const tenantUsers = DEMO_USERS.filter((u) => u.tenantId === selectedTenant)

            if (!tenant) return null

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Tenant Information</h4>
                    <div className="space-y-2 text-sm">
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
                    <h4 className="font-medium mb-2">Usage Statistics</h4>
                    <div className="space-y-2 text-sm">
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
                  <h4 className="font-medium mb-2">Team Members</h4>
                  <div className="space-y-2">
                    {tenantUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs capitalize">
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

      {/* Create Tenant Dialog */}
      {showTenantDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Tenant</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Farm/Company Name</label>
                <input
                  type="text"
                  value={newTenantForm.name}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Green Valley Farm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Admin Email</label>
                <input
                  type="email"
                  value={newTenantForm.email}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="admin@greenvalley.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Plan</label>
                <select
                  value={newTenantForm.plan}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, plan: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="starter">Starter - $29/month</option>
                  <option value="professional">Professional - $79/month</option>
                  <option value="enterprise">Enterprise - $199/month</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowTenantDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Create Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
