"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import { CheckCircle, Leaf, BarChart3, Users, Settings, ArrowRight, Play, BookOpen, Zap } from "lucide-react"

const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to FarmFlow!",
    description: "Let's get you set up for success",
    icon: Leaf,
  },
  {
    id: "tour",
    title: "Quick Tour",
    description: "Learn the basics of your dashboard",
    icon: Play,
  },
  {
    id: "setup",
    title: "Initial Setup",
    description: "Configure your farm settings",
    icon: Settings,
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Start managing your farm",
    icon: CheckCircle,
  },
]

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const { user, tenant } = useAuth()
  const router = useRouter()

  const handleNext = () => {
    const current = onboardingSteps[currentStep]
    if (!completedSteps.includes(current.id)) {
      setCompletedSteps([...completedSteps, current.id])
    }

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Onboarding complete, redirect to dashboard
      router.push("/dashboard")
    }
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100
  const currentStepData = onboardingSteps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FarmFlow</span>
          </div>
          <div className="mb-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {onboardingSteps.length}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">{currentStepData.title}</CardTitle>
            <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Welcome, {user?.firstName}!</h3>
                <p className="text-muted-foreground mb-4">
                  Your farm "{tenant?.name}" is ready to go. Let's walk through the key features that will help you
                  manage your operations more efficiently.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Inventory Tracking</h4>
                  <p className="text-sm text-muted-foreground">Monitor stock levels and costs</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Labor Management</h4>
                  <p className="text-sm text-muted-foreground">Track deployments and costs</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">AI Insights</h4>
                  <p className="text-sm text-muted-foreground">Get smart recommendations</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Dashboard Overview</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Navigation Sidebar</h4>
                    <p className="text-sm text-muted-foreground">
                      Access all features from the left sidebar: Inventory, Labor, Analytics, and Settings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Quick Actions</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the "+" button to quickly add inventory items, record transactions, or log labor.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Real-time Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      All data syncs automatically across devices, so your team always has the latest information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Initial Setup</h3>
                <p className="text-muted-foreground">
                  We've pre-configured your account with sample data. You can start using FarmFlow right away or
                  customize these settings later.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sample Inventory Items</h4>
                    <p className="text-sm text-muted-foreground">Common farm supplies and materials</p>
                  </div>
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Added
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Labor Categories</h4>
                    <p className="text-sm text-muted-foreground">Standard expenditure codes for tracking</p>
                  </div>
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">User Permissions</h4>
                    <p className="text-sm text-muted-foreground">You have full admin access as the owner</p>
                  </div>
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Set
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-semibold mb-4">Congratulations!</h3>
                <p className="text-muted-foreground mb-6">
                  Your FarmFlow account is ready. You can now start managing your farm operations more efficiently than
                  ever before.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Documentation</h4>
                  <p className="text-sm text-muted-foreground">Learn advanced features and best practices</p>
                </Card>
                <Card className="p-4">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-2">Support</h4>
                  <p className="text-sm text-muted-foreground">Get help from our expert team</p>
                </Card>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Setup
            </Button>
            <Button onClick={handleNext}>
              {currentStep === onboardingSteps.length - 1 ? "Go to Dashboard" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
