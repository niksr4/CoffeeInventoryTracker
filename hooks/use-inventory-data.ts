"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { InventoryItem, Transaction } from "@/lib/storage"

export function useInventoryData() {
  // State for inventory and transactions
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [redisConnected, setRedisConnected] = useState<boolean | null>(null)

  // Use refs to track the latest state without triggering re-renders
  const inventoryRef = useRef<InventoryItem[]>([])
  const transactionsRef = useRef<Transaction[]>([])

  // Ref to track if we're currently in the middle of an update operation
  const isUpdatingRef = useRef(false)

  // Ref to track the last update timestamp
  const lastUpdateTimestampRef = useRef<number>(0)

  // Disable automatic polling by default - we'll rely on manual syncs
  const [pollingEnabled, setPollingEnabled] = useState(false)

  // Function to fetch data from the API
  const fetchData = useCallback(async (forceFetch = false) => {
    // If we're already updating, don't fetch
    if (isUpdatingRef.current) {
      console.log("Skipping fetch because an update is in progress")
      return
    }

    try {
      setLoading(true)

      // Fetch data from the API
      const response = await fetch("/api/inventory/batch")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Update Redis connection status
      setRedisConnected(data.redis_connected)

      // Always update from the API to ensure the frontend reflects the source of truth (Redis).
      // The previous timestamp comparison logic was preventing updates.
      setInventory(data.inventory || [])
      setTransactions(data.transactions || [])

      inventoryRef.current = data.inventory || []
      transactionsRef.current = data.transactions || []

      lastUpdateTimestampRef.current = data.timestamp || 0

      console.log("Updated with API data:", {
        inventoryCount: data.inventory?.length || 0,
        transactionsCount: data.transactions?.length || 0,
      })

      setLastSync(new Date())
      setError(null)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data from server.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Function to add a transaction
  const addTransaction = useCallback(async (transaction: Transaction) => {
    // Set the updating flag to prevent concurrent updates
    isUpdatingRef.current = true

    try {
      // Send the transaction to the API
      const response = await fetch("/api/inventory/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "addTransaction",
          data: {
            transaction,
          },
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to add transaction")
      }

      // Update Redis connection status
      setRedisConnected(data.redis_connected)

      // Update our state and refs with the API data
      setInventory(data.inventory || [])
      setTransactions(data.transactions || [])

      inventoryRef.current = data.inventory || []
      transactionsRef.current = data.transactions || []

      lastUpdateTimestampRef.current = data.timestamp

      setLastSync(new Date())
      setError(null)

      return true
    } catch (err) {
      console.error("Error adding transaction:", err)
      setError("Failed to add transaction. Please try again.")
      return false
    } finally {
      // Clear the updating flag
      isUpdatingRef.current = false
    }
  }, [])

  // Function to perform a batch update
  const batchUpdate = useCallback(async (newTransactions: Transaction[]) => {
    // Set the updating flag to prevent concurrent updates
    isUpdatingRef.current = true

    try {
      // Send the batch update to the API
      const response = await fetch("/api/inventory/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "batchUpdate",
          data: {
            transactions: newTransactions,
          },
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to perform batch update")
      }

      // Update Redis connection status
      setRedisConnected(data.redis_connected)

      // Update our state and refs with the API data
      setInventory(data.inventory || [])
      setTransactions(data.transactions || [])

      inventoryRef.current = data.inventory || []
      transactionsRef.current = data.transactions || []

      lastUpdateTimestampRef.current = data.timestamp

      setLastSync(new Date())
      setError(null)

      return true
    } catch (err) {
      console.error("Error performing batch update:", err)
      setError("Failed to update data. Please try again.")
      return false
    } finally {
      // Clear the updating flag
      isUpdatingRef.current = false
    }
  }, [])

  // Function to check storage status
  const checkStorageStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/storage-status")

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setRedisConnected(data.redis_connected)
        return data.storage_status
      } else {
        throw new Error(data.error || "Failed to check storage status")
      }
    } catch (err) {
      console.error("Error checking storage status:", err)
      return null
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData(true) // Force fetch on initial load
  }, [fetchData])

  // Set up polling for updates (only if enabled)
  useEffect(() => {
    if (!pollingEnabled) return

    const intervalId = setInterval(() => {
      // Only fetch if we're not currently updating
      if (!isUpdatingRef.current) {
        fetchData()
      }
    }, 60000) // 60 seconds

    return () => clearInterval(intervalId)
  }, [fetchData, pollingEnabled])

  return {
    inventory,
    transactions,
    addTransaction,
    batchUpdate,
    loading,
    error,
    lastSync,
    refreshData: fetchData,
    setPollingEnabled,
    redisConnected,
    checkStorageStatus,
  }
}
