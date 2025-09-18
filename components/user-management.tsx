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
    const existingInvitation = pendingInvitations.find((inv) => inv.email.toLowerCase() === inviteForm.email.toLowerCase())
    if (existingInvitation) {
      newErrors.email = "An invitation has already been sent to this email"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      // In production, this would call your invitation API
      console.log("Sending invitation:", inviteForm)
