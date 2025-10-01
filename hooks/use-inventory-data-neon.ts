"use client"

import { useState, useEffect } from "react"

export type InventoryItem = {
  name: string
  quantity: number
  unit: string
}

export type Transaction = {
  id: string
  itemType: string
  quantity: number
  transactionType: "Depleting" | "Restocking" | "Item Deleted" | "Unit Change"
  notes: string
  date: string
  user: string
  unit: string
  price?: number
  totalCost?: number
}

export function useInventoryDataNeon() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch from Neon-based API routes
      const [inventoryResponse, transactionsResponse] = await Promise.all([
        fetch("/api/inventory-neon"),
        fetch("/api/transactions-neon"),
      ])

      if (!inventoryResponse.ok || !transactionsResponse.ok) {
        throw new Error("Failed to fetch data from Neon")
      }

      const inventoryData = await inventoryResponse.json()
      const transactionsData = await transactionsResponse.json()

      setInventoryItems(inventoryData.items || [])
      setTransactions(transactionsData.transactions || [])
      setLastUpdate(Date.now())
    } catch (err) {
      console.error("Error fetching Neon data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    try {
      const response = await fetch("/api/transactions-neon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        throw new Error("Failed to add transaction")
      }

      // Refresh data after adding
      await fetchData()
      return true
    } catch (err) {
      console.error("Error adding transaction:", err)
      setError(err instanceof Error ? err.message : "Failed to add transaction")
      return false
    }
  }

  const refreshData = () => {
    fetchData()
  }

  return {
    inventoryItems,
    transactions,
    loading,
    error,
    lastUpdate,
    addTransaction,
    refreshData,
  }
}
