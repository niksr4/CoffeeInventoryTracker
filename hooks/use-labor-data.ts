"use client"

import { useState, useEffect, useCallback } from "react"

export interface LaborEntry {
  laborCount: number
  costPerLabor: number
}

export interface LaborDeployment {
  id: string
  code: string
  reference: string
  laborEntries: LaborEntry[]
  totalCost: number
  date: string
  notes?: string
  user: string
  updatedAt?: string
}

export function useLaborData() {
  const [deployments, setDeployments] = useState<LaborDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("📡 Fetching labor deployments...")

      const response = await fetch("/api/labor-neon", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json()
      console.log("📦 Received labor data:", data)

      if (data.success && Array.isArray(data.deployments)) {
        console.log(`✅ Loaded ${data.deployments.length} labor deployments`)
        setDeployments(data.deployments)
        setError(null)
      } else if (data.success && Array.isArray(data.transactions)) {
        // Handle case where API returns transactions instead of deployments
        console.log(`✅ Loaded ${data.transactions.length} labor transactions`)
        setDeployments(data.transactions)
        setError(null)
      } else {
        console.error("❌ Invalid response format:", data)
        setError(data.message || "Failed to load deployments")
        setDeployments([])
      }
    } catch (err: any) {
      console.error("❌ Error fetching labor deployments:", err)
      setError(err.message || "Failed to fetch deployments")
      setDeployments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  const addDeployment = async (deployment: Omit<LaborDeployment, "id" | "totalCost" | "updatedAt">) => {
    try {
      console.log("📤 Adding new labor deployment...")

      const response = await fetch("/api/labor-neon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deployment),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Labor deployment added successfully")
        await fetchDeployments()
        setError(null)
        return true
      } else {
        console.error("❌ Failed to add deployment:", data.message)
        setError(data.message || "Failed to add deployment")
        return false
      }
    } catch (err: any) {
      console.error("❌ Error adding deployment:", err)
      setError(err.message || "Failed to add deployment")
      return false
    }
  }

  const updateDeployment = async (
    id: string,
    deployment: Omit<LaborDeployment, "id" | "totalCost" | "user" | "updatedAt">,
  ) => {
    try {
      console.log(`📤 Updating labor deployment ${id}...`)

      const response = await fetch("/api/labor-neon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...deployment }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Labor deployment updated successfully")
        await fetchDeployments()
        setError(null)
        return true
      } else {
        console.error("❌ Failed to update deployment:", data.message)
        setError(data.message || "Failed to update deployment")
        return false
      }
    } catch (err: any) {
      console.error("❌ Error updating deployment:", err)
      setError(err.message || "Failed to update deployment")
      return false
    }
  }

  const deleteDeployment = async (id: string) => {
    try {
      console.log(`📤 Deleting labor deployment ${id}...`)

      const response = await fetch(`/api/labor-neon?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Labor deployment deleted successfully")
        setDeployments((prev) => prev.filter((d) => d.id !== id))
        setError(null)
        return true
      } else {
        console.error("❌ Failed to delete deployment:", data.message)
        setError(data.message || "Failed to delete deployment")
        return false
      }
    } catch (err: any) {
      console.error("❌ Error deleting deployment:", err)
      setError(err.message || "Failed to delete deployment")
      return false
    }
  }

  return {
    deployments,
    loading,
    error,
    addDeployment,
    updateDeployment,
    deleteDeployment,
    refetch: fetchDeployments,
  }
}
