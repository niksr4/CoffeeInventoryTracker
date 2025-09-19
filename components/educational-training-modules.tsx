"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { BookOpen, Play, CheckCircle, Clock, Award, Users, Search, Star, TrendingUp, Brain } from "lucide-react"

interface TrainingModule {
  id: string
  title: string
  description: string
  category: "Beekeeping" | "Farm Management" | "Safety" | "Technology" | "Business"
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  duration: number // in minutes
  progress: number // 0-100
  completed: boolean
  rating: number
  enrolledUsers: number
  prerequisites?: string[]
  skills: string[]
  instructor: string
  lastUpdated: string
}

interface LearningPath {
  id: string
  title: string
  description: string
  modules: string[]
  totalDuration: number
  completionRate: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: string
  points: number
}

export default function EducationalTrainingModules() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [activeTab, setActiveTab] = useState("modules")

  // Mock data - in real app, this would come from API
  const [modules] = useState<TrainingModule[]>([
    {
      id: "1",
      title: "Introduction to Beekeeping",
      description: "Learn the fundamentals of beekeeping, from hive setup to basic maintenance.",
      category: "Beekeeping",
      difficulty: "Beginner",
      duration: 45,
      progress: 100,
      completed: true,
      rating: 4.8,
      enrolledUsers: 1250,
      skills: ["Hive Management", "Bee Biology", "Safety Protocols"],
      instructor: "Dr. Sarah Johnson",
      lastUpdated: "2024-01-15",
    },
    {
      id: "2",
      title: "Advanced Honey Harvesting Techniques",
      description: "Master professional honey extraction methods and quality control.",
      category: "Beekeeping",
      difficulty: "Advanced",
      duration: 90,
      progress: 65,
      completed: false,
      rating: 4.9,
      enrolledUsers: 850,
      prerequisites: ["Introduction to Beekeeping"],
      skills: ["Honey Extraction", "Quality Control", "Processing"],
      instructor: "Mark Thompson",
      lastUpdated: "2024-01-20",
    },
    {
      id: "3",
      title: "Farm Safety and Risk Management",
      description: "Essential safety protocols and risk assessment for farm operations.",
      category: "Safety",
      difficulty: "Intermediate",
      duration: 60,
      progress: 30,
      completed: false,
      rating: 4.7,
      enrolledUsers: 950,
      skills: ["Risk Assessment", "Safety Protocols", "Emergency Response"],
      instructor: "Lisa Chen",
      lastUpdated: "2024-01-18",
    },
    {
      id: "4",
      title: "Digital Farm Management Systems",
      description: "Learn to use modern technology for efficient farm operations.",
      category: "Technology",
      difficulty: "Intermediate",
      duration: 75,
      progress: 0,
      completed: false,
      rating: 4.6,
      enrolledUsers: 720,
      skills: ["Digital Tools", "Data Analysis", "Automation"],
      instructor: "Alex Rodriguez",
      lastUpdated: "2024-01-22",
    },
    {
      id: "5",
      title: "Business Planning for Honey Farms",
      description: "Develop comprehensive business strategies for profitable honey farming.",
      category: "Business",
      difficulty: "Advanced",
      duration: 120,
      progress: 0,
      completed: false,
      rating: 4.5,
      enrolledUsers: 650,
      skills: ["Business Strategy", "Financial Planning", "Marketing"],
      instructor: "Jennifer Davis",
      lastUpdated: "2024-01-25",
    },
  ])

  const [learningPaths] = useState<LearningPath[]>([
    {
      id: "1",
      title: "Complete Beekeeping Mastery",
      description: "From beginner to expert beekeeper in 6 comprehensive modules",
      modules: ["1", "2", "6", "7", "8", "9"],
      totalDuration: 480,
      completionRate: 45,
      difficulty: "Beginner",
      category: "Beekeeping",
    },
    {
      id: "2",
      title: "Modern Farm Management",
      description: "Technology-driven approach to efficient farm operations",
      modules: ["4", "10", "11", "12"],
      totalDuration: 300,
      completionRate: 20,
      difficulty: "Intermediate",
      category: "Technology",
    },
    {
      id: "3",
      title: "Farm Business Excellence",
      description: "Build and scale a profitable agricultural business",
      modules: ["5", "13", "14", "15"],
      totalDuration: 360,
      completionRate: 0,
      difficulty: "Advanced",
      category: "Business",
    },
  ])

  const [achievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first training module",
      icon: "🎯",
      earned: true,
      earnedDate: "2024-01-15",
      points: 100,
    },
    {
      id: "2",
      title: "Knowledge Seeker",
      description: "Complete 5 training modules",
      icon: "📚",
      earned: false,
      points: 250,
    },
    {
      id: "3",
      title: "Expert Level",
      description: "Complete an advanced level course",
      icon: "🏆",
      earned: false,
      points: 500,
    },
    {
      id: "4",
      title: "Perfect Score",
      description: "Achieve 100% in any assessment",
      icon: "⭐",
      earned: true,
      earnedDate: "2024-01-16",
      points: 200,
    },
  ])

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || module.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "All" || module.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const categories = ["All", "Beekeeping", "Farm Management", "Safety", "Technology", "Business"]
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"]

  const totalProgress = Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / modules.length)
  const completedModules = modules.filter((module) => module.completed).length
  const totalPoints = achievements.filter((a) => a.earned).reduce((sum, a) => sum + a.points, 0)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold text-green-600">{totalProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {completedModules}/{modules.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points Earned</p>
                <p className="text-2xl font-bold text-yellow-600">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Skills Gained</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Array.from(new Set(modules.flatMap((m) => m.skills))).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search training modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>

          {/* Training Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="mt-2">{module.description}</CardDescription>
                    </div>
                    {module.completed && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{module.category}</Badge>
                    <Badge
                      variant={
                        module.difficulty === "Beginner"
                          ? "default"
                          : module.difficulty === "Intermediate"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {module.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{module.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{module.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{module.enrolledUsers}</span>
                    </div>
                  </div>

                  {module.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Skills you'll learn:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button className="flex-1" variant={module.completed ? "outline" : "default"}>
                      {module.completed ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Review
                        </>
                      ) : module.progress > 0 ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.map((path) => (
              <Card key={path.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{path.title}</CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{path.category}</Badge>
                    <Badge
                      variant={
                        path.difficulty === "Beginner"
                          ? "default"
                          : path.difficulty === "Intermediate"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {path.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{path.modules.length} modules</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.round(path.totalDuration / 60)}h {path.totalDuration % 60}m
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion</span>
                      <span>{path.completionRate}%</span>
                    </div>
                    <Progress value={path.completionRate} className="h-2" />
                  </div>

                  <Button className="w-full">{path.completionRate > 0 ? "Continue Path" : "Start Path"}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`hover:shadow-lg transition-shadow ${
                  achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={achievement.earned ? "default" : "secondary"}>
                          {achievement.points} points
                        </Badge>
                        {achievement.earned && achievement.earnedDate && (
                          <span className="text-xs text-green-600">
                            Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Progress</span>
                    <span className="font-semibold">{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{completedModules}</p>
                    <p className="text-sm text-muted-foreground">Completed Modules</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{modules.length - completedModules}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules
                    .filter((m) => m.progress > 0)
                    .slice(0, 5)
                    .map((module) => (
                      <div key={module.id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${module.completed ? "bg-green-500" : "bg-blue-500"}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{module.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {module.completed ? "Completed" : `${module.progress}% complete`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
