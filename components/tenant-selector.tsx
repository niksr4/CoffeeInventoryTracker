"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Building2, Users, Zap, Crown } from "lucide-react"
import type { Tenant } from "@/lib/tenant"

interface TenantSelectorProps {
  tenants: Tenant[]
  onSelectTenant: (tenant: Tenant) => void
}

export default function TenantSelector({ tenants, onSelectTenant }: TenantSelectorProps) {
  const { user } = useAuth()
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant.id)
    onSelectTenant(tenant)
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "starter":
        return "bg-blue-100 text-blue-800"
      case "professional":
        return "bg-green-100 text-green-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "starter":
        return <Zap className="h-4 w-4" />
      case "professional":
        return <Users className="h-4 w-4" />
      case "enterprise":
        return <Crown className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Your Farm</h1>
          <p className="text-muted-foreground">Choose which farm you'd like to manage today</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTenant === tenant.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectTenant(tenant)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  </div>
                  <Badge className={getPlanColor(tenant.plan)}>
                    <div className="flex items-center space-x-1">
                      {getPlanIcon(tenant.plan)}
                      <span className="capitalize">{tenant.plan}</span>
                    </div>
                  </Badge>
                </div>
                <CardDescription>{tenant.slug}.farmflow.com</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Users:</span>
                    <span>{tenant.settings.maxUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span>{tenant.settings.features.length}</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant={selectedTenant === tenant.id ? "default" : "outline"}>
                  {selectedTenant === tenant.id ? "Selected" : "Select Farm"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Create New Farm
          </Button>
        </div>
      </div>
    </div>
  )
}
