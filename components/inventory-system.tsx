"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Brain } from "lucide-react"
import AIAnalysisPanel from "./ai-analysis-panel"

const data = [
  { name: "Jan", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Mar", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Apr", uv: 2780, pv: 3908, amt: 2000 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100 },
]

function generateRandomTransaction() {
  const items = [
    "Keyboard",
    "Mouse",
    "Monitor",
    "Headphones",
    "Webcam",
    "Microphone",
    "Speaker",
    "Laptop",
    "Tablet",
    "Printer",
  ]
  const quantities = [1, 2, 3, 4, 5]
  const prices = [25, 50, 75, 100, 125, 150, 175, 200]
  const types = ["Purchase", "Sale", "Return"]

  const item = items[Math.floor(Math.random() * items.length)]
  const quantity = quantities[Math.floor(Math.random() * quantities.length)]
  const price = prices[Math.floor(Math.random() * prices.length)]
  const type = types[Math.floor(Math.random() * types.length)]
  const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Last 30 days

  return {
    item,
    quantity,
    price,
    type,
    date: date.toLocaleDateString(),
  }
}

function generateRandomTransactions(count) {
  const transactions = []
  for (let i = 0; i < count; i++) {
    transactions.push(generateRandomTransaction())
  }
  return transactions
}

const initialTransactions = generateRandomTransactions(10)

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
]

export default function InventorySystem() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [transactions, setTransactions] = useState(initialTransactions)
  const [open, setOpen] = useState(false)
  const [framework, setFramework] = useState<string>("")
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Inventory Value</CardTitle>
            <CardDescription>Current value of all items in stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$56,789</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items in Stock</CardTitle>
            <CardDescription>Number of unique items currently in stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">345</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items that are running low on stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Overview of sales performance over the last few months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="pv" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>{transaction.item}</TableCell>
                <TableCell>{transaction.quantity}</TableCell>
                <TableCell>${transaction.price}</TableCell>
                <TableCell>{transaction.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showAIAnalysis && (
        <div className="mt-6">
          <AIAnalysisPanel />
        </div>
      )}

      <Separator className="my-6" />

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Last synced: 2 minutes ago</p>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <div className="space-x-2">
          <Button variant="outline">Sync Inventory</Button>
          <Button
            onClick={() => setShowAIAnalysis(!showAIAnalysis)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {showAIAnalysis ? "Hide AI Analysis" : "AI Analysis"}
          </Button>
        </div>
      </div>
    </div>
  )
}
