"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Target,
  Sprout,
  Droplets,
  Sun,
  Tractor,
  Award,
  Star,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Zap,
  Leaf,
  BarChart3,
} from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  type: "gold" | "silver" | "bronze"
  unlocked: boolean
  progress: number
  maxProgress: number
}

interface GameScenario {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  points: number
  completed: boolean
  icon: React.ComponentType<any>
}

interface FarmTask {
  id: string
  title: string
  description: string
  category: "planting" | "maintenance" | "harvesting" | "monitoring"
  priority: "low" | "medium" | "high"
  progress: number
  dueDate: string
  points: number
  completed: boolean
}

export default function FarmFlowDashboard() {
  const [userLevel, setUserLevel] = useState(12)
  const [userXP, setUserXP] = useState(2450)
  const [nextLevelXP] = useState(3000)
  const [totalPoints, setTotalPoints] = useState(15680)

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first-harvest",
      title: "First Harvest",
      description: "Complete your first harvest cycle",
      icon: Sprout,
      type: "bronze",
      unlocked: true,
      progress: 1,
      maxProgress: 1,
    },
    {
      id: "efficiency-master",
      title: "Efficiency Master",
      description: "Achieve 95% efficiency rating",
      icon: Target,
      type: "gold",
      unlocked: true,
      progress: 95,
      maxProgress: 95,
    },
    {
      id: "water-wise",
      title: "Water Wise",
      description: "Optimize water usage for 30 days",
      icon: Droplets,
      type: "silver",
      unlocked: false,
      progress: 18,
      maxProgress: 30,
    },
    {
      id: "tech-innovator",
      title: "Tech Innovator",
      description: "Use 5 different smart farming tools",
      icon: Zap,
      type: "gold",
      unlocked: false,
      progress: 3,
      maxProgress: 5,
    },
  ])

  const [gameScenarios, setGameScenarios] = useState<GameScenario[]>([
    {
      id: "drought-management",
      title: "Drought Management",
      description: "Manage your farm during a severe drought period",
      difficulty: "hard",
      points: 500,
      completed: false,
      icon: Sun,
    },
    {
      id: "pest-control",
      title: "Pest Control Challenge",
      description: "Handle a pest outbreak using sustainable methods",
      difficulty: "medium",
      points: 300,
      completed: true,
      icon: Leaf,
    },
    {
      id: "harvest-optimization",
      title: "Harvest Optimization",
      description: "Maximize yield during harvest season",
      difficulty: "easy",
      points: 200,
      completed: true,
      icon: Tractor,
    },
  ])

  const [farmTasks, setFarmTasks] = useState<FarmTask[]>([
    {
      id: "soil-testing",
      title: "Soil pH Testing",
      description: "Test soil pH levels in sectors A-C",
      category: "monitoring",
      priority: "high",
      progress: 75,
      dueDate: "2024-01-20",
      points: 150,
      completed: false,
    },
    {
      id: "irrigation-check",
      title: "Irrigation System Check",
      description: "Inspect and maintain irrigation systems",
      category: "maintenance",
      priority: "medium",
      progress: 100,
      dueDate: "2024-01-18",
      points: 200,
      completed: true,
    },
    {
      id: "seed-planting",
      title: "Spring Seed Planting",
      description: "Plant spring crops in designated areas",
      category: "planting",
      priority: "high",
      progress: 45,
      dueDate: "2024-01-25",
      points: 300,
      completed: false,
    },
  ])

  const CircularProgress = ({
    progress,
    size = 80,
    strokeWidth = 8,
  }: { progress: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--progress-bg))"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--progress-fill))"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
      </div>
    )
  }

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
    const Icon = achievement.icon
    const getBadgeColor = (type: string) => {
      switch (type) {
        case "gold":
          return "bg-yellow-100 text-yellow-800 border-yellow-300"
        case "silver":
          return "bg-gray-100 text-gray-800 border-gray-300"
        case "bronze":
          return "bg-orange-100 text-orange-800 border-orange-300"
        default:
          return "bg-gray-100 text-gray-800 border-gray-300"
      }
    }

    return (
      <Card
        className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${achievement.unlocked ? "border-primary/20" : "opacity-60"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getBadgeColor(achievement.type)}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
              {!achievement.unlocked && (
                <div className="mt-2">
                  <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.progress}/{achievement.maxProgress}
                  </p>
                </div>
              )}
            </div>
            {achievement.unlocked && <CheckCircle className="h-5 w-5 text-primary" />}
          </div>
        </CardContent>
      </Card>
    )
  }

  const TaskCard = ({ task }: { task: FarmTask }) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "high":
          return "bg-red-100 text-red-800"
        case "medium":
          return "bg-yellow-100 text-yellow-800"
        case "low":
          return "bg-green-100 text-green-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    const getCategoryIcon = (category: string) => {
      switch (category) {
        case "planting":
          return Sprout
        case "maintenance":
          return Tractor
        case "harvesting":
          return Sun
        case "monitoring":
          return BarChart3
        default:
          return Target
      }
    }

    const CategoryIcon = getCategoryIcon(task.category)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CategoryIcon className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">{task.title}</h4>
            </div>
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{task.dueDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{task.points} pts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Progress Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <CircularProgress progress={(userXP / nextLevelXP) * 100} size={80} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{userLevel}</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">Farm Manager Level {userLevel}</h2>
                <p className="text-sm text-muted-foreground">
                  {userXP} / {nextLevelXP} XP to next level
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">{totalPoints} points</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {achievements.filter((a) => a.unlocked).length} achievements
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Team Progress
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold text-primary">24</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-primary">8</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Score</p>
                <p className="text-2xl font-bold text-primary">94%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold text-primary">12</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Active Farm Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {farmTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Farm Management Scenarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameScenarios.map((scenario) => {
              const Icon = scenario.icon
              const getDifficultyColor = (difficulty: string) => {
                switch (difficulty) {
                  case "easy":
                    return "bg-green-100 text-green-800"
                  case "medium":
                    return "bg-yellow-100 text-yellow-800"
                  case "hard":
                    return "bg-red-100 text-red-800"
                  default:
                    return "bg-gray-100 text-gray-800"
                }
              }

              return (
                <Card
                  key={scenario.id}
                  className={`hover:shadow-md transition-shadow ${scenario.completed ? "border-green-200 bg-green-50/50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <Badge className={`text-xs ${getDifficultyColor(scenario.difficulty)}`}>
                        {scenario.difficulty}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-2">{scenario.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{scenario.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">{scenario.points} pts</span>
                      </div>
                      {scenario.completed ? (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Button size="sm" className="h-7 text-xs">
                          Start Challenge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
