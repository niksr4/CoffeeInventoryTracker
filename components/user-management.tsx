"use client"

import { useState } from "react"
import { useTenantAuth } from "@/hooks/use-tenant-auth"
import { validateEmail } from "@/lib/auth-service"
import { DEMO_USERS, DEMO_INVITATIONS } from "@/lib/tenant"
import type { TenantUser } from "@/lib/auth-service"

export default function UserManagement() {
  const { tenant, user, isAdmin } = useTenantAuth()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null)

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "user" as "admin" | "user" | "viewer",
    message: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!tenant || !user || !isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to manage users.</p>
      </div>
    )
  }

  // Get users for current tenant
  const tenantUsers = DEMO_USERS.filter((u) => u.tenantId === tenant.id)
  const pendingInvitations = DEMO_INVITATIONS.filter((inv) => inv.tenantId === tenant.id && inv.status === "pending")

  const handleInviteUser = async () => {
    const newErrors: Record<string, string> = {}

    if (!inviteForm.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(inviteForm.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Check if user already exists
    const existingUser = tenantUsers.find((u) => u.email.toLowerCase() === inviteForm.email.toLowerCase())
    if (existingUser) {
      newErrors.email = "A user with this email already exists"
    }

    // Check if invitation already sent
    const existingInvitation = pendingInvitations.find(
      (inv) => inv.email.toLowerCase() === inviteForm.email.toLowerCase(),
    )
    if (existingInvitation) {
      newErrors.email = "An invitation has already been sent to this email"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      // In production, this would call your invitation API
      console.log("Sending invitation:", inviteForm)

      // Simulate successful invitation
      alert(`Invitation sent to ${inviteForm.email}`)

      // Reset form
      setInviteForm({ email: "", role: "user", message: "" })
      setShowInviteDialog(false)
    } catch (error) {
      console.error("Failed to send invitation:", error)
      setErrors({ general: "Failed to send invitation. Please try again." })
    }
  }

  const handleEditUser = (user: TenantUser) => {
    setEditingUser(user)
    setShowEditDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      // In production, this would call your user update API
      console.log("Updating user:", editingUser)

      alert(`User ${editingUser.email} updated successfully`)
      setShowEditDialog(false)
      setEditingUser(null)
    } catch (error) {
      console.error("Failed to update user:", error)
      setErrors({ general: "Failed to update user. Please try again." })
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return

    try {
      // In production, this would call your user removal API
      console.log("Removing user:", userId)

      alert("User removed successfully")
    } catch (error) {
      console.error("Failed to remove user:", error)
      setErrors({ general: "Failed to remove user. Please try again." })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage team members and their permissions</p>
        </div>
        <button
          onClick={() => setShowInviteDialog(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Invite User
        </button>
      </div>

      {/* Current Users */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Team Members ({tenantUsers.length})</h3>
        <div className="space-y-3">
          {tenantUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm capitalize">
                  {user.role}
                </span>
                {user.id !== user.id && (
                  <div className="flex space-x-1">
                    <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 text-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Invitations ({pendingInvitations.length})</h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{invitation.email}</p>
                  <p className="text-sm text-muted-foreground">Invited {invitation.createdAt}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Pending</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Resend</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite User Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="viewer">Viewer - Read only access</option>
                  <option value="user">User - Full access to farm data</option>
                  <option value="admin">Admin - Full access + user management</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Personal Message (Optional)</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  className="w-full p-2 border rounded-lg h-20"
                  placeholder="Welcome to our team!"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowInviteDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {showEditDialog && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="viewer">Viewer - Read only access</option>
                  <option value="user">User - Full access to farm data</option>
                  <option value="admin">Admin - Full access + user management</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
