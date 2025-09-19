"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  CalendarIcon,
  Clock,
  User,
  Target,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Search,
  Sprout,
  Tractor,
  Sun,
  BarChart3,
  Droplets,
  Bug,
  Leaf,
  Zap,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

interface Task {
  id: string
  title: string
  description: string
  category:
    | "planting"
    | "maintenance"
    | "harvesting"
    | "monitoring"
    | "irrigation"
    | "pest-control"
    | "fertilization"
    | "equipment"
  priority: "low" | "medium" | "high" | "urgent"
  status: "not-started" | "in-progress" | "completed" | "paused" | "cancelled"
  assignedTo: string
  createdBy: string
  startDate: Date
  dueDate: Date
  estimatedHours: number
  actualHours?: number
  progress: number
  location?: string
  equipment?: string[]
  materials?: string[]
  dependencies?: string[]
  notes?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface TaskTemplate {
  id: string
  name: string
  description: string
  category: Task["category"]
  estimatedHours: number
  priority: Task["priority"]
  materials: string[]
  equipment: string[]
}

const taskTemplates: TaskTemplate[] = [
  {
    id: "soil-testing",
    name: "Soil pH Testing",
    description: "Test soil pH levels and nutrient content",
    category: "monitoring",
    estimatedHours: 2,
    priority: "medium",
    materials: ["pH test kit", "Soil samples"],
    equipment: ["pH meter", "Sample containers"],
  },
  {
    id: "irrigation-maintenance",
    name: "Irrigation System Maintenance",
    description: "Check and maintain irrigation systems",
    category: "maintenance",
    estimatedHours: 4,
    priority: "high",
    materials: ["Replacement parts", "Lubricants"],
    equipment: ["Tools", "Pressure gauge"],
  },
  {
    id: "crop-planting",
    name: "Crop Planting",
    description: "Plant seasonal crops in designated areas",
    category: "planting",
    estimatedHours: 8,
    priority: "high",
    materials: ["Seeds", "Fertilizer", "Mulch"],
    equipment: ["Planting tools", "Tractor"],
  },
  {
    id: "pest-inspection",
    name: "Pest Inspection",
    description: "Inspect crops for pest damage and apply treatments",
    category: "pest-control",
    estimatedHours: 3,
    priority: "medium",
    materials: ["Pesticides", "Protective gear"],
    equipment: ["Sprayer", "Magnifying glass"],
  },
  {
    id: "harvest-collection",
    name: "Harvest Collection",
    description: "Collect mature crops from designated areas",
    category: "harvesting",
    estimatedHours: 6,
    priority: "urgent",
    materials: ["Collection containers", "Storage bags"],
    equipment: ["Harvesting tools", "Transport vehicle"],
  },
]

export default function TaskPlanningSystem() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [activeTab, setActiveTab] = useState("board")

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // New task form
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    category: "monitoring",
    priority: "medium",
    assignedTo: "",
    startDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    estimatedHours: 1,
    progress: 0,
    location: "",
    equipment: [],
    materials: [],
    notes: "",
  })

  // Sample data - in real app this would come from API
  useEffect(() => {
    const sampleTasks: Task[] = [
      {
        id: "1",
        title: "Soil pH Testing - North Field",
        description: "Test soil pH levels in the north field to determine fertilizer needs",
        category: "monitoring",
        priority: "high",
        status: "in-progress",
        assignedTo: "John Smith",
        createdBy: "Farm Manager",
        startDate: new Date(),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estimatedHours: 3,
        actualHours: 1.5,
        progress: 50,
        location: "North Field",
        equipment: ["pH meter", "Sample containers"],
        materials: ["pH test strips"],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "2",
        title: "Irrigation System Repair",
        description: "Fix broken sprinkler heads in sector B",
        category: "maintenance",
        priority: "urgent",
        status: "not-started",
        assignedTo: "Mike Johnson",
        createdBy: "Farm Manager",
        startDate: new Date(),
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimatedHours: 4,
        progress: 0,
        location: "Sector B",
        equipment: ["Wrench set", "Replacement heads"],
        materials: ["Sprinkler heads", "Pipe fittings"],
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "3",
        title: "Tomato Harvest",
        description: "Harvest ripe tomatoes from greenhouse 1",
        category: "harvesting",
        priority: "medium",
        status: "completed",
        assignedTo: "Sarah Wilson",
        createdBy: "Farm Manager",
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        estimatedHours: 6,
        actualHours: 5.5,
        progress: 100,
        location: "Greenhouse 1",
        equipment: ["Harvest baskets", "Pruning shears"],
        materials: ["Storage crates"],
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]
    setTasks(sampleTasks)
  }, [])

  // Filter tasks based on current filters
  useEffect(() => {
    let filtered = tasks

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((task) => task.category === categoryFilter)
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((task) => task.assignedTo === assigneeFilter)
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, statusFilter, categoryFilter, priorityFilter, assigneeFilter, searchTerm])

  const getCategoryIcon = (category: Task["category"]) => {
    switch (category) {
      case "planting":
        return Sprout
      case "maintenance":
        return Tractor
      case "harvesting":
        return Sun
      case "monitoring":
        return BarChart3
      case "irrigation":
        return Droplets
      case "pest-control":
        return Bug
      case "fertilization":
        return Leaf
      case "equipment":
        return Zap
      default:
        return Target
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      case "not-started":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.assignedTo) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and assignee",
        variant: "destructive",
      })
      return
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title!,
      description: newTask.description || "",
      category: newTask.category!,
      priority: newTask.priority!,
      status: "not-started",
      assignedTo: newTask.assignedTo!,
      createdBy: "Current User", // In real app, get from auth
      startDate: newTask.startDate!,
      dueDate: newTask.dueDate!,
      estimatedHours: newTask.estimatedHours!,
      progress: 0,
      location: newTask.location,
      equipment: newTask.equipment || [],
      materials: newTask.materials || [],
      notes: newTask.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTasks([...tasks, task])
    setIsCreateDialogOpen(false)
    setNewTask({
      title: "",
      description: "",
      category: "monitoring",
      priority: "medium",
      assignedTo: "",
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: 1,
      progress: 0,
      location: "",
      equipment: [],
      materials: [],
      notes: "",
    })
    setSelectedTemplate(null)

    toast({
      title: "Task created",
      description: "New task has been created successfully",
    })
  }

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task["status"]) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              progress: newStatus === "completed" ? 100 : task.progress,
              completedAt: newStatus === "completed" ? new Date() : undefined,
              updatedAt: new Date(),
            }
          : task,
      ),
    )

    toast({
      title: "Task updated",
      description: `Task status changed to ${newStatus.replace("-", " ")}`,
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
    toast({
      title: "Task deleted",
      description: "Task has been removed successfully",
    })
  }

  const applyTemplate = (template: TaskTemplate) => {
    setNewTask({
      ...newTask,
      title: template.name,
      description: template.description,
      category: template.category,
      priority: template.priority,
      estimatedHours: template.estimatedHours,
      materials: template.materials,
      equipment: template.equipment,
    })
    setSelectedTemplate(template)
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const CategoryIcon = getCategoryIcon(task.category)
    const isOverdue = new Date() > task.dueDate && task.status !== "completed"

    return (
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? "border-red-200 bg-red-50/30" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CategoryIcon className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm line-clamp-1">{task.title}</h4>
            </div>
            <div className="flex items-center space-x-1">
              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40" align="end">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setEditingTask(task)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1" />
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span className="truncate">{task.assignedTo}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>{format(task.dueDate, "MMM dd")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Badge className={`text-xs ${getStatusColor(task.status)}`}>{task.status.replace("-", " ")}</Badge>
            <div className="flex space-x-1">
              {task.status === "not-started" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs bg-transparent"
                  onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </Button>
              )}
              {task.status === "in-progress" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-transparent"
                    onClick={() => handleUpdateTaskStatus(task.id, "paused")}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </Button>
                </>
              )}
              {task.status === "paused" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs bg-transparent"
                  onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              )}
            </div>
          </div>

          {task.location && (
            <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{task.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const TaskBoard = () => {
    const columns = [
      { status: "not-started", title: "To Do", tasks: filteredTasks.filter((t) => t.status === "not-started") },
      { status: "in-progress", title: "In Progress", tasks: filteredTasks.filter((t) => t.status === "in-progress") },
      { status: "paused", title: "Paused", tasks: filteredTasks.filter((t) => t.status === "paused") },
      { status: "completed", title: "Completed", tasks: filteredTasks.filter((t) => t.status === "completed") },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">{column.title}</h3>
              <Badge variant="outline" className="text-xs">
                {column.tasks.length}
              </Badge>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const TaskList = () => (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tasks found matching your filters</p>
        </div>
      )}
    </div>
  )

  const uniqueAssignees = Array.from(new Set(tasks.map((t) => t.assignedTo)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Task Planning & Management</h1>
          <p className="text-muted-foreground">Organize and track farm operations efficiently</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-primary">{tasks.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.filter((t) => t.status === "in-progress").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter((t) => t.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {tasks.filter((t) => new Date() > t.dueDate && t.status !== "completed").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="planting">Planting</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="pest-control">Pest Control</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {uniqueAssignees.map((assignee) => (
                    <SelectItem key={assignee} value={assignee}>
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-6">
          <TaskBoard />
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <TaskList />
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Create a new farm task and assign it to a team member</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task Templates */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Templates</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {taskTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                    size="sm"
                    className="justify-start h-auto p-3"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-xs">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.estimatedHours}h • {template.category}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Task Title *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Assigned To *</label>
                <Select
                  value={newTask.assignedTo}
                  onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="John Smith">John Smith</SelectItem>
                    <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                    <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                    <SelectItem value="David Brown">David Brown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe the task in detail"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={newTask.category}
                  onValueChange={(value: Task["category"]) => setNewTask({ ...newTask, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="pest-control">Pest Control</SelectItem>
                    <SelectItem value="fertilization">Fertilization</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: Task["priority"]) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estimated Hours</label>
                <Input
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.startDate ? format(newTask.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.startDate}
                      onSelect={(date) => setNewTask({ ...newTask, startDate: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? format(newTask.dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.dueDate}
                      onSelect={(date) => setNewTask({ ...newTask, dueDate: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={newTask.location}
                onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                placeholder="e.g., North Field, Greenhouse 1, Sector B"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={newTask.notes}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                placeholder="Additional notes or instructions"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
