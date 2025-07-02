"use client"

import { useState, useEffect, useCallback } from "react"
import type { LaborDeployment, LaborEntry } from "@/app/api/labor/route"
import { toast } from "@/components/ui/use-toast"

export function useLaborData() {
  const [deployments, setDeployments] = useState<LaborDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeployments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/labor")
      if (!response.ok) {
        throw new Error("Failed to fetch labor deployments.")
      }
      const data = await response.json()
      setDeployments(data.deployments || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
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
    user: string
    notes?: string
  }) => {
    try {
      const response = await fetch("/api/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
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
    }
  }

  return { deployments, loading, error, addDeployment, refreshDeployments: fetchDeployments }
}
