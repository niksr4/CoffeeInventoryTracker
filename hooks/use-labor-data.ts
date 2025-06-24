"use client"

import { useState, useEffect, useCallback } from "react"
import type { LaborDeployment, LaborEntry, ConsumableEntry } from "@/app/api/labor/route" // Ensure ConsumableEntry is imported
import { toast } from "@/components/ui/use-toast"

// Export types for use in components
export type { LaborDeployment, LaborEntry, ConsumableEntry }

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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch labor deployments. Status: ${response.status}`)
      }
      const data = await response.json()
      setDeployments(data.deployments || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching deployments."
      setError(errorMessage)
      // Avoid toast for initial load errors unless critical, or make it less intrusive
      // console.error("Fetch Deployments Error:", errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  const addDeployment = async (deploymentData: {
    code: string
    reference: string
    laborEntries: LaborEntry[]
    otherConsumables?: Omit<ConsumableEntry, "totalCost">[] // API calculates totalCost
    user: string
    date: string // User-selected date
    notes?: string
  }) => {
    setLoading(true)
    try {
      const response = await fetch("/api/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to record labor deployment.")
      }

      await fetchDeployments() // Refresh data
      toast({
        title: "Success",
        description: "Labor deployment recorded successfully.",
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateDeployment = async (deploymentId: string, deploymentData: Partial<Omit<LaborDeployment, "id">>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/labor`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deploymentId, ...deploymentData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update labor deployment.")
      }

      await fetchDeployments() // Refresh data
      toast({
        title: "Success",
        description: "Labor deployment updated successfully.",
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteDeployment = async (deploymentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/labor?id=${deploymentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete labor deployment.")
      }

      await fetchDeployments() // Refresh data
      toast({
        title: "Success",
        description: "Labor deployment deleted successfully.",
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    deployments,
    loading,
    error,
    addDeployment,
    updateDeployment,
    deleteDeployment,
    refreshDeployments: fetchDeployments,
  }
}
