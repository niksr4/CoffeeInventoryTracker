"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Save, X, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type InventoryItem = {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  lastUpdated: string
}

export default function InventoryTracker() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("coffeeInventory")
      if (saved) {
        return JSON.parse(saved)
      }
    }

    // Default items
    return [
      {
        id: "1",
        name: "Arabica Beans",
        quantity: 5,
        unit: "kg",
        category: "Beans",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Robusta Beans",
        quantity: 3,
        unit: "kg",
        category: "Beans",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Milk",
        quantity: 10,
        unit: "L",
        category: "Dairy",
        lastUpdated: new Date().toISOString(),
      },
    ]
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 0,
    unit: "",
    category: "",
  })
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("coffeeInventory", JSON.stringify(items))
  }, [items])

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0 || !newItem.unit || !newItem.category) {
      return
    }

    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      lastUpdated: new Date().toISOString(),
    }

    setItems([...items, item])
    setNewItem({ name: "", quantity: 0, unit: "", category: "" })
    setIsAdding(false)
  }

  const handleUpdateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...updates,
            lastUpdated: new Date().toISOString(),
          }
        }
        return item
      }),
    )
    setEditingId(null)
  }

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Coffee className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {isAdding && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input
                  type="number"
                  value={newItem.quantity || ""}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  placeholder="Quantity"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="kg, L, pcs, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="Beans, Dairy, etc."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} className="bg-amber-600 hover:bg-amber-700">
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-amber-800">Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found. Add some items to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          />
                        ) : (
                          <div className="font-medium">{item.name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  quantity: Number(e.target.value),
                                })
                              }
                              className="w-20"
                              min="0"
                            />
                            <Input
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                              className="w-16"
                            />
                          </div>
                        ) : (
                          <div>
                            {item.quantity} {item.unit}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {editingId === item.id ? (
                          <Input
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                          />
                        ) : (
                          <Badge variant="outline" className="bg-amber-100">
                            {item.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateItem(item.id, item)}
                              className="text-green-600"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(item.id)}
                              className="text-amber-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-amber-800">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-100 p-4 rounded-lg">
              <div className="text-sm text-amber-800 mb-1">Total Items</div>
              <div className="text-2xl font-bold">{items.length}</div>
            </div>
            <div className="bg-amber-100 p-4 rounded-lg">
              <div className="text-sm text-amber-800 mb-1">Categories</div>
              <div className="text-2xl font-bold">{new Set(items.map((item) => item.category)).size}</div>
            </div>
            <div className="bg-amber-100 p-4 rounded-lg">
              <div className="text-sm text-amber-800 mb-1">Low Stock Items</div>
              <div className="text-2xl font-bold">{items.filter((item) => item.quantity <= 2).length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
