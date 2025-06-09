"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useInventoryData } from "@/hooks/use-inventory-data"
import { v4 as uuidv4 } from "uuid"

export default function InventoryTransactionForm() {
  const { user } = useAuth()
  const { inventory, addTransaction, refreshData } = useInventoryData()

  const [formData, setFormData] = useState({
    itemType: "",
    quantity: 0,
    transactionType: "Restocking",
    notes: "",
    unit: "kg",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customItem, setCustomItem] = useState("")
  const [showCustomItem, setShowCustomItem] = useState(false)

  // Get unique item types from inventory
  const itemTypes = Array.from(new Set([...inventory.map((item) => item.name), "micromin"])).sort()

  // Reset form after submission
  const resetForm = () => {
    setFormData({
      itemType: "",
      quantity: 0,
      transactionType: "Restocking",
      notes: "",
      unit: "kg",
    })
    setCustomItem("")
    setShowCustomItem(false)
  }

  // Update unit when item type changes
  useEffect(() => {
    if (formData.itemType && !showCustomItem) {
      const selectedItem = inventory.find((item) => item.name === formData.itemType)
      if (selectedItem) {
        setFormData((prev) => ({ ...prev, unit: selectedItem.unit }))
      }
    }
  }, [formData.itemType, inventory, showCustomItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.itemType && !customItem) {
        throw new Error("Please select or enter an item")
      }

      if (formData.quantity <= 0) {
        throw new Error("Quantity must be greater than zero")
      }

      // Create transaction object
      const transaction = {
        id: uuidv4(),
        itemType: showCustomItem ? customItem : formData.itemType,
        quantity: formData.quantity,
        transactionType: formData.transactionType as "Depleting" | "Restocking",
        notes: formData.notes,
        date: new Date().toISOString(),
        user: user?.username || "unknown",
        unit: formData.unit,
      }

      // Add transaction
      const success = await addTransaction(transaction)

      if (success) {
        toast({
          title: "Transaction Added",
          description: `Successfully ${formData.transactionType.toLowerCase()} ${formData.quantity} ${formData.unit} of ${
            showCustomItem ? customItem : formData.itemType
          }`,
        })
        resetForm()
        refreshData()
      } else {
        throw new Error("Failed to add transaction")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
        <CardDescription>Record inventory changes with this form</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select
              value={formData.transactionType}
              onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
            >
              <SelectTrigger id="transactionType">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Restocking">Restocking</SelectItem>
                <SelectItem value="Depleting">Depleting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="itemType">Item</Label>
              <Button
                type="button"
                variant="link"
                className="text-xs p-0 h-auto"
                onClick={() => setShowCustomItem(!showCustomItem)}
              >
                {showCustomItem ? "Select Existing Item" : "Add New Item"}
              </Button>
            </div>

            {showCustomItem ? (
              <Input
                id="customItem"
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                placeholder="Enter new item name"
              />
            ) : (
              <Select
                value={formData.itemType}
                onValueChange={(value) => setFormData({ ...formData, itemType: value })}
              >
                <SelectTrigger id="itemType">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="bags">bags</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional information"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Add Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
