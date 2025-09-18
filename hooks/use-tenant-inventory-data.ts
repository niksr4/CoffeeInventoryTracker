"use client"

import { useState, useEffect, useCallback } from "react"
import type { InventoryItem, Transaction } from "@/lib/storage"
import {
  getTenantTransactions,
  addTenantTransaction,
  performTenantBatchOperation,
  getTenantInventoryItems,
  getTenantLastUpdate,
  initializeTenantDefaultData,
} from "@/lib/tenant-storage"
import { useTenantAuth } from "./use-tenant-auth"

export function useTenantInventoryData() {
  const { tenant, isAuthenticated } = useTenantAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refreshData = useCallback(
    async (force = false) => {
      if (!isAuthenticated || !tenant) {
        setLoading(false)
        return
      }

      try {
        setError(null)
        if (force) setLoading(true)

        // Initialize default data if this is a new tenant
        await initializeTenantDefaultData()

        // Fetch tenant-specific data
        const [tenantTransactions, tenantInventory, lastUpdate] = await Promise.all([
          getTenantTransactions(),
          getTenantInventoryItems(),
          getTenantLastUpdate(),
        ])

        setTransactions(tenantTransactions)
        setInventory(tenantInventory)
        setLastSync(new Date(lastUpdate))
      } catch (err) {
        console.error("Error refreshing tenant data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated, tenant],
  )

  const addTransaction = useCallback(
    async (transaction: Transaction): Promise<boolean> => {
      if (!isAuthenticated || !tenant) {
        return false
      }

      try {
        const success = await addTenantTransaction(transaction)
        if (success) {
          await refreshData()
        }
        return success
      } catch (err) {
        console.error("Error adding transaction:", err)
        setError(err instanceof Error ? err.message : "Failed to add transaction")
        return false
      }
    },
    [isAuthenticated, tenant, refreshData],
  )

  const batchUpdate = useCallback(
    async (newTransactions: Transaction[]): Promise<boolean> => {
      if (!isAuthenticated || !tenant) {
        return false
      }

      try {
        const success = await performTenantBatchOperation(newTransactions)
        if (success) {
          await refreshData()
        }
        return success
      } catch (err) {
        console.error("Error performing batch update:", err)
        setError(err instanceof Error ? err.message : "Failed to update data")
        return false
      }
    },
    [isAuthenticated, tenant, refreshData],
  )

  // Load data when tenant changes
  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    inventory,
    transactions,
    addTransaction,
    batchUpdate,
    refreshData,
    loading,
    error,
    lastSync,
  }
}
