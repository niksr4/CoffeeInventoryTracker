"use client"

import { useState, useEffect, useCallback } from "react"
import type { ConsumableDeployment } from "@/app/api/consumables/route"
import { toast } from "@/components/ui/use-toast"

export type { ConsumableDeployment }

export function useConsumablesData() {
  const [deployments, setDeployments] = useState<ConsumableDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeployments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/consumables")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch consumable entries. Status: ${response.status}`)
      }
      const data = await response.json()
      setDeployments(data.deployments || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeployments()
  }, [fetchDeployments])

  const addDeployment = async (deploymentData: Omit<ConsumableDeployment, "id" | "user"> & { user: string }) => {
    setLoading(true)
    try {
      const response = await fetch("/api/consumables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to record consumable entry.")
      }

      await fetchDeployments()
      toast({ title: "Success", description: "Consumable entry recorded successfully." })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateDeployment = async (deploymentId: string, deploymentData: Partial<Omit<ConsumableDeployment, "id">>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/consumables`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deploymentId, ...deploymentData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update consumable entry.")
      }

      await fetchDeployments()
      toast({ title: "Success", description: "Consumable entry updated successfully." })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteDeployment = async (deploymentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/consumables?id=${deploymentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete consumable entry.")
      }

      await fetchDeployments()
      toast({ title: "Success", description: "Consumable entry deleted successfully." })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
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
