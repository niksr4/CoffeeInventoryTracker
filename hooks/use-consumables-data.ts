"use client"

import { useState, useEffect } from "react"

interface Deployment {
  id: number
  date: string
  code: string
  reference: string
  amount: number
  notes: string
  user: string
}

export function useConsumablesData() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeployments = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching deployments from /api/expenses-neon...")

      const response = await fetch("/api/expenses-neon")
      const data = await response.json()

      console.log("📥 Raw API response:", data)

      if (data.success && data.deployments) {
        console.log("✅ Deployments loaded:", data.deployments.length)
        console.log("📋 First deployment:", data.deployments[0])
        setDeployments(data.deployments)
      } else {
        console.error("❌ Failed to load deployments:", data)
        setDeployments([])
      }
    } catch (error) {
      console.error("❌ Error fetching deployments:", error)
      setDeployments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeployments()
  }, [])

  const addDeployment = async (deployment: Omit<Deployment, "id">) => {
    try {
      console.log("➕ Adding deployment:", deployment)

      const response = await fetch("/api/expenses-neon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deployment),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Deployment added successfully")
        await fetchDeployments() // Refresh the list
      } else {
        console.error("❌ Failed to add deployment:", data)
      }
    } catch (error) {
      console.error("❌ Error adding deployment:", error)
    }
  }

  const updateDeployment = async (id: number, deployment: Omit<Deployment, "id" | "user">) => {
    try {
      console.log("📝 Updating deployment:", id, deployment)

      const response = await fetch("/api/expenses-neon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...deployment }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Deployment updated successfully")
        await fetchDeployments() // Refresh the list
      } else {
        console.error("❌ Failed to update deployment:", data)
      }
    } catch (error) {
      console.error("❌ Error updating deployment:", error)
    }
  }

  const deleteDeployment = async (id: number) => {
    try {
      console.log("🗑️ Deleting deployment:", id)

      const response = await fetch(`/api/expenses-neon?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        console.log("✅ Deployment deleted successfully")
        await fetchDeployments() // Refresh the list
      } else {
        console.error("❌ Failed to delete deployment:", data)
      }
    } catch (error) {
      console.error("❌ Error deleting deployment:", error)
    }
  }

  return {
    deployments,
    loading,
    addDeployment,
    updateDeployment,
    deleteDeployment,
    refetch: fetchDeployments,
  }
}
