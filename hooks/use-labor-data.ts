"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"

export type LaborEntry = {
  laborCount: number
  costPerLabor: number
}

export type LaborDeployment = {
  id: string
  code: string
  reference: string
  laborEntries: LaborEntry[]
  totalCost: number
  date: string
  user: string
  notes?: string
}

export function useLaborData() {
  const [deployments, setDeployments] = useState<LaborDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeployments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/labor")
      if (!response.ok) {
        throw new Error("Failed to fetch labor deployments")
      }
      const data = await response.json()
      setDeployments(data.deployments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setDeployments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  const addDeployment = async (deploymentData: Omit<LaborDeployment, "id" | "totalCost" | "date">) => {
    try {
      const response = await fetch("/api/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add deployment")
      }
      await fetchDeployments() // Refresh data
      return true
    } catch (err) {
      console.error("Error adding deployment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not save deployment.",
        variant: "destructive",
      })
      return false
    }
  }

  const updateDeployment = async (deploymentData: LaborDeployment) => {
    try {
      const response = await fetch("/api/labor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update deployment")
      }
      await fetchDeployments() // Refresh data
      return true
    } catch (err) {
      console.error("Error updating deployment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not update deployment.",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteDeployment = async (id: string) => {
    try {
      const response = await fetch("/api/labor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete deployment")
      }
      await fetchDeployments() // Refresh data
      return true
    } catch (err) {
      console.error("Error deleting deployment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not delete deployment.",
        variant: "destructive",
      })
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
    refreshData: fetchDeployments,
  }
}
