"use client"

import { useState, useEffect, useCallback } from "react"

export interface ConsumableDeployment {
  id: string
  date: string
  code: string
  reference: string
  amount: number
  notes?: string
  user: string
}

export function useConsumablesData() {
  const [deployments, setDeployments] = useState<ConsumableDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      console.log("[CLIENT] Fetching other expenses data...")

      const response = await fetch("/api/consumables-neon", {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch other expenses")
      }

      const data = await response.json()
      console.log("[CLIENT] ✅ Fetched other expenses:", data)

      setDeployments(Array.isArray(data.deployments) ? data.deployments : [])
      setError(null)
    } catch (err: any) {
      console.error("[CLIENT] ❌ Error fetching other expenses data:", err)
      setError(err.message || "Failed to fetch other expenses data")
      setDeployments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addDeployment = useCallback(
    async (deployment: Omit<ConsumableDeployment, "id">) => {
      try {
        console.log("[CLIENT] Adding other expense:", deployment)

        const response = await fetch("/api/consumables-neon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deployment),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add other expense")
        }

        console.log("[CLIENT] ✅ Other expense added")
        await fetchData()
        return true
      } catch (err: any) {
        console.error("[CLIENT] ❌ Error adding other expense:", err)
        setError(err.message || "Failed to add other expense")
        return false
      }
    },
    [fetchData],
  )

  const updateDeployment = useCallback(
    async (id: string, deployment: Omit<ConsumableDeployment, "id" | "user">) => {
      try {
        console.log("[CLIENT] Updating other expense:", id)

        const response = await fetch("/api/consumables-neon", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...deployment }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update other expense")
        }

        console.log("[CLIENT] ✅ Other expense updated")
        await fetchData()
        return true
      } catch (err: any) {
        console.error("[CLIENT] ❌ Error updating other expense:", err)
        setError(err.message || "Failed to update other expense")
        return false
      }
    },
    [fetchData],
  )

  const deleteDeployment = useCallback(
    async (id: string) => {
      try {
        console.log("[CLIENT] Deleting other expense:", id)

        const response = await fetch(`/api/consumables-neon?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to delete other expense")
        }

        console.log("[CLIENT] ✅ Other expense deleted")
        await fetchData()
        return true
      } catch (err: any) {
        console.error("[CLIENT] ❌ Error deleting other expense:", err)
        setError(err.message || "Failed to delete other expense")
        return false
      }
    },
    [fetchData],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    deployments,
    loading,
    error,
    addDeployment,
    updateDeployment,
    deleteDeployment,
    refreshData: fetchData,
  }
}
