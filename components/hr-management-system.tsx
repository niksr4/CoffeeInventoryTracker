"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  Clock,
  CalendarIcon,
  Star,
  Award,
  MapPin,
  Phone,
  Mail,
  Edit,
  Eye,
  Search,
  Download,
  Target,
  DollarSign,
  Timer,
  PlayCircle,
  StopCircle,
  Settings,
  UserCheck,
  Briefcase,
  Home,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: "field" | "greenhouse" | "processing" | "management" | "maintenance" | "sales"
  hireDate: Date
  status: "active" | "inactive" | "on-leave" | "terminated"
  salary: number
  hourlyRate?: number
  address: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  skills: string[]
  certifications: string[]
  performanceRating: number // 1-5 scale
  avatar?: string
  notes?: string
}

interface TimeEntry {
  id: string
  employeeId: string
  date: Date
  clockIn: Date
  clockOut?: Date
  breakTime: number // minutes
  totalHours: number
  task: string
  location: string
  status: "active" | "completed" | "break"
  notes?: string
  approvedBy?: string
  approved: boolean
}

interface PerformanceReview {
  id: string
  employeeId: string
  reviewDate: Date
  reviewPeriod: string
  overallRating: number
  categories: {
    productivity: number
    quality: number
    teamwork: number
    punctuality: number
    initiative: number
  }
  goals: string[]
  achievements: string[]
  areasForImprovement: string[]
  reviewerNotes: string
  employeeComments?: string
  nextReviewDate: Date
}

interface Shift {
  id: string
  employeeId: string
  date: Date
  startTime: string
  endTime: string
  position: string
  location: string
  status: "scheduled" | "confirmed" | "completed" | "no-show"
  notes?: string
}

const sampleEmployees: Employee[] = [
  {
    id: "emp-001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@honeyfarm.com",
    phone: "+1-555-0101",
    position: "Farm Manager",
    department: "management",
    hireDate: new Date("2023-01-15"),
    status: "active",
    salary: 65000,
    address: "123 Farm Road, Rural County, State 12345",
    emergencyContact: {
      name: "Jane Smith",
      phone: "+1-555-0102",
      relationship: "Spouse",
    },
    skills: ["Leadership", "Crop Management", "Equipment Operation", "Team Coordination"],
    certifications: ["Organic Farming Certification", "Safety Management"],
    performanceRating: 4.5,
    notes: "Excellent leadership skills and deep agricultural knowledge.",
  },
  {
    id: "emp-002",
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria.garcia@honeyfarm.com",
    phone: "+1-555-0201",
    position: "Field Worker",
    department: "field",
    hireDate: new Date("2023-03-20"),
    status: "active",
    salary: 35000,
    hourlyRate: 18,
    address: "456 Village Street, Rural County, State 12345",
    emergencyContact: {
      name: "Carlos Garcia",
      phone: "+1-555-0202",
      relationship: "Brother",
    },
    skills: ["Planting", "Harvesting", "Irrigation", "Pest Control"],
    certifications: ["Pesticide Application License"],
    performanceRating: 4.2,
    notes: "Reliable worker with excellent attention to detail.",
  },
  {
    id: "emp-003",
    firstName: "David",
    lastName: "Johnson",
    email: "david.johnson@honeyfarm.com",
    phone: "+1-555-0301",
    position: "Greenhouse Specialist",
    department: "greenhouse",
    hireDate: new Date("2023-05-10"),
    status: "active",
    salary: 42000,
    hourlyRate: 22,
    address: "789 Garden Lane, Rural County, State 12345",
    emergencyContact: {
      name: "Sarah Johnson",
      phone: "+1-555-0302",
      relationship: "Wife",
    },
    skills: ["Climate Control", "Plant Propagation", "Hydroponics", "Disease Management"],
    certifications: ["Greenhouse Management Certificate", "Integrated Pest Management"],
    performanceRating: 4.7,
    notes: "Expert in greenhouse operations and plant health management.",
  },
  {
    id: "emp-004",
    firstName: "Lisa",
    lastName: "Brown",
    email: "lisa.brown@honeyfarm.com",
    phone: "+1-555-0401",
    position: "Processing Technician",
    department: "processing",
    hireDate: new Date("2023-07-01"),
    status: "on-leave",
    salary: 38000,
    hourlyRate: 20,
    address: "321 Processing Way, Rural County, State 12345",
    emergencyContact: {
      name: "Michael Brown",
      phone: "+1-555-0402",
      relationship: "Husband",
    },
    skills: ["Food Safety", "Quality Control", "Equipment Maintenance", "Packaging"],
    certifications: ["HACCP Certification", "Food Handler's License"],
    performanceRating: 4.0,
    notes: "Currently on maternity leave. Expected return in 2 months.",
  },
]

const sampleTimeEntries: TimeEntry[] = [
  {
    id: "time-001",
    employeeId: "emp-001",
    date: new Date(),
    clockIn: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    clockOut: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    breakTime: 60,
    totalHours: 7.5,
    task: "Field Inspection and Planning",
    location: "North Field",
    status: "completed",
    approved: true,
    approvedBy: "System Admin",
  },
  {
    id: "time-002",
    employeeId: "emp-002",
    date: new Date(),
    clockIn: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    breakTime: 30,
    totalHours: 5.5,
    task: "Tomato Harvesting",
    location: "Greenhouse 1",
    status: "active",
    approved: false,
  },
  {
    id: "time-003",
    employeeId: "emp-003",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    clockIn: new Date(Date.now() - 32 * 60 * 60 * 1000),
    clockOut: new Date(Date.now() - 24 * 60 * 60 * 1000),
    breakTime: 45,
    totalHours: 7.25,
    task: "Climate System Maintenance",
    location: "Greenhouse 2",
    status: "completed",
    approved: true,
    approvedBy: "John Smith",
  },
]

export default function HRManagementSystem() {
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(sampleTimeEntries)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [isTimeTrackingOpen, setIsTimeTrackingOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("employees")
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // New employee form
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "field",
    salary: 0,
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    skills: [],
    certifications: [],
    performanceRating: 3,
    notes: "",
  })

  // Time tracking
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null)
  const [currentTask, setCurrentTask] = useState("")
  const [currentLocation, setCurrentLocation] = useState("")

  const getDepartmentIcon = (department: Employee["department"]) => {
    switch (department) {
      case "field":
        return Target
      case "greenhouse":
        return Home
      case "processing":
        return Settings
      case "management":
        return Briefcase
      case "maintenance":
        return Settings
      case "sales":
        return DollarSign
      default:
        return Users
    }
  }

  const getStatusColor = (status: Employee["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "on-leave":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "terminated":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 4.0) return "text-blue-600"
    if (rating >= 3.5) return "text-yellow-600"
    if (rating >= 3.0) return "text-orange-600"
    return "text-red-600"
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const handleAddEmployee = () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const employee: Employee = {
      id: `emp-${Date.now()}`,
      firstName: newEmployee.firstName!,
      lastName: newEmployee.lastName!,
      email: newEmployee.email!,
      phone: newEmployee.phone || "",
      position: newEmployee.position || "",
      department: newEmployee.department!,
      hireDate: new Date(),
      status: "active",
      salary: newEmployee.salary || 0,
      address: newEmployee.address || "",
      emergencyContact: newEmployee.emergencyContact || {
        name: "",
        phone: "",
        relationship: "",
      },
      skills: newEmployee.skills || [],
      certifications: newEmployee.certifications || [],
      performanceRating: newEmployee.performanceRating || 3,
      notes: newEmployee.notes,
    }

    setEmployees([...employees, employee])
    setIsAddEmployeeOpen(false)
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "field",
      salary: 0,
      address: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      skills: [],
      certifications: [],
      performanceRating: 3,
      notes: "",
    })

    toast({
      title: "Employee added",
      description: "New employee has been added successfully",
    })
  }

  const handleClockIn = (employeeId: string) => {
    if (!currentTask || !currentLocation) {
      toast({
        title: "Missing information",
        description: "Please specify task and location",
        variant: "destructive",
      })
      return
    }

    const timeEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      employeeId,
      date: new Date(),
      clockIn: new Date(),
      breakTime: 0,
      totalHours: 0,
      task: currentTask,
      location: currentLocation,
      status: "active",
      approved: false,
    }

    setTimeEntries([...timeEntries, timeEntry])
    setActiveTimeEntry(timeEntry)
    setCurrentTask("")
    setCurrentLocation("")

    toast({
      title: "Clocked in",
      description: "Time tracking started successfully",
    })
  }

  const handleClockOut = (timeEntryId: string) => {
    const now = new Date()
    setTimeEntries(
      timeEntries.map((entry) => {
        if (entry.id === timeEntryId) {
          const totalHours = (now.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60) - entry.breakTime / 60
          return {
            ...entry,
            clockOut: now,
            totalHours: Math.round(totalHours * 100) / 100,
            status: "completed" as const,
          }
        }
        return entry
      }),
    )

    setActiveTimeEntry(null)

    toast({
      title: "Clocked out",
      description: "Time entry completed successfully",
    })
  }

  const getTodayHours = (employeeId: string) => {
    const today = new Date().toDateString()
    return timeEntries
      .filter((entry) => entry.employeeId === employeeId && entry.date.toDateString() === today)
      .reduce((total, entry) => total + entry.totalHours, 0)
  }

  const getWeeklyHours = (employeeId: string) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return timeEntries
      .filter((entry) => entry.employeeId === employeeId && entry.date >= oneWeekAgo)
      .reduce((total, entry) => total + entry.totalHours, 0)
  }

  const EmployeeCard = ({ employee }: { employee: Employee }) => {
    const DepartmentIcon = getDepartmentIcon(employee.department)
    const todayHours = getTodayHours(employee.id)
    const weeklyHours = getWeeklyHours(employee.id)
    const isCurrentlyWorking = timeEntries.some(
      (entry) => entry.employeeId === employee.id && entry.status === "active",
    )

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-sm">
                  {employee.firstName} {employee.lastName}
                </h4>
                <p className="text-xs text-muted-foreground">{employee.position}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getStatusColor(employee.status)}`}>{employee.status}</Badge>
              {isCurrentlyWorking && <Badge className="text-xs bg-blue-100 text-blue-800">Working</Badge>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <DepartmentIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground capitalize">{employee.department}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className={`h-3 w-3 ${getPerformanceColor(employee.performanceRating)}`} />
                <span className={getPerformanceColor(employee.performanceRating)}>
                  {employee.performanceRating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Today:</span>
                <span className="ml-1 font-medium">{todayHours.toFixed(1)}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">Week:</span>
                <span className="ml-1 font-medium">{weeklyHours.toFixed(1)}h</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{employee.email}</span>
            </div>

            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{employee.phone}</span>
            </div>

            {employee.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {employee.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {employee.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{employee.skills.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedEmployee(employee)}
              className="flex-1 h-7 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedEmployee(employee)
                setIsEditEmployeeOpen(true)
              }}
              className="flex-1 h-7 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const TimeTrackingCard = ({ employee }: { employee: Employee }) => {
    const activeEntry = timeEntries.find((entry) => entry.employeeId === employee.id && entry.status === "active")
    const todayEntries = timeEntries.filter(
      (entry) => entry.employeeId === employee.id && entry.date.toDateString() === new Date().toDateString(),
    )
    const todayHours = todayEntries.reduce((total, entry) => total + entry.totalHours, 0)

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {employee.firstName[0]}
                  {employee.lastName[0]}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-sm">
                  {employee.firstName} {employee.lastName}
                </h4>
                <p className="text-xs text-muted-foreground">{employee.position}</p>
              </div>
            </div>
            <Badge className={activeEntry ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {activeEntry ? "Working" : "Off Duty"}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Today's Hours:</span>
              <span className="ml-2 font-medium">{todayHours.toFixed(1)} hours</span>
            </div>

            {activeEntry && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">Current Task</div>
                <div className="text-sm font-medium">{activeEntry.task}</div>
                <div className="text-xs text-muted-foreground">{activeEntry.location}</div>
                <div className="text-xs text-blue-600 mt-1">Started: {format(activeEntry.clockIn, "HH:mm")}</div>
              </div>
            )}

            <div className="flex space-x-2">
              {!activeEntry ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(employee)
                    setIsTimeTrackingOpen(true)
                  }}
                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Clock In
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleClockOut(activeEntry.id)}
                  className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700"
                >
                  <StopCircle className="h-3 w-3 mr-1" />
                  Clock Out
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">
                <Timer className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">HR Management</h1>
          <p className="text-muted-foreground">Manage employees, time tracking, and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setIsAddEmployeeOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-primary">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter((e) => e.status === "active").length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Working</p>
                <p className="text-2xl font-bold text-blue-600">
                  {timeEntries.filter((e) => e.status === "active").length}
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
                <p className="text-sm text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(employees.reduce((sum, e) => sum + e.performanceRating, 0) / employees.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="field">Field</SelectItem>
                      <SelectItem value="greenhouse">Greenhouse</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No employees found matching your filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees
              .filter((e) => e.status === "active")
              .map((employee) => (
                <TimeTrackingCard key={employee.id} employee={employee} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-xs text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{employee.performanceRating.toFixed(1)}/5.0</div>
                        <div className="w-20">
                          <Progress value={(employee.performanceRating / 5) * 100} className="h-2" />
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Schedule management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hours Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => {
                    const weeklyHours = getWeeklyHours(employee.id)
                    return (
                      <div key={employee.id} className="flex justify-between items-center">
                        <span className="text-sm">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <span className="font-medium">{weeklyHours.toFixed(1)}h</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["field", "greenhouse", "processing", "management", "maintenance", "sales"].map((dept) => {
                    const count = employees.filter((e) => e.department === dept).length
                    const percentage = (count / employees.length) * 100
                    return (
                      <div key={dept} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{dept}</span>
                          <span>{count} employees</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter the employee's information below</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">First Name *</label>
                <Input
                  value={newEmployee.firstName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Last Name *</label>
                <Input
                  value={newEmployee.lastName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email *</label>
                <Input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Position</label>
                <Input
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  placeholder="Enter job position"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select
                  value={newEmployee.department}
                  onValueChange={(value: Employee["department"]) =>
                    setNewEmployee({ ...newEmployee, department: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">Field</SelectItem>
                    <SelectItem value="greenhouse">Greenhouse</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Annual Salary</label>
              <Input
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                placeholder="Enter annual salary"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Address</label>
              <Textarea
                value={newEmployee.address}
                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                placeholder="Enter full address"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Emergency Contact</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={newEmployee.emergencyContact?.name}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      emergencyContact: { ...newEmployee.emergencyContact!, name: e.target.value },
                    })
                  }
                  placeholder="Contact name"
                />
                <Input
                  value={newEmployee.emergencyContact?.phone}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      emergencyContact: { ...newEmployee.emergencyContact!, phone: e.target.value },
                    })
                  }
                  placeholder="Contact phone"
                />
                <Input
                  value={newEmployee.emergencyContact?.relationship}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      emergencyContact: { ...newEmployee.emergencyContact!, relationship: e.target.value },
                    })
                  }
                  placeholder="Relationship"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={newEmployee.notes}
                onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })}
                placeholder="Additional notes about the employee"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Tracking Dialog */}
      <Dialog open={isTimeTrackingOpen} onOpenChange={setIsTimeTrackingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock In</DialogTitle>
            <DialogDescription>
              {selectedEmployee && `Clock in ${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Task *</label>
              <Input
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="What task will you be working on?"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location *</label>
              <Select value={currentLocation} onValueChange={setCurrentLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North Field">North Field</SelectItem>
                  <SelectItem value="South Field">South Field</SelectItem>
                  <SelectItem value="Greenhouse 1">Greenhouse 1</SelectItem>
                  <SelectItem value="Greenhouse 2">Greenhouse 2</SelectItem>
                  <SelectItem value="Processing Facility">Processing Facility</SelectItem>
                  <SelectItem value="Storage Area">Storage Area</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeTrackingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedEmployee) {
                  handleClockIn(selectedEmployee.id)
                  setIsTimeTrackingOpen(false)
                }
              }}
              disabled={!currentTask || !currentLocation}
            >
              Clock In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      {selectedEmployee && !isEditEmployeeOpen && (
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </DialogTitle>
              <DialogDescription>{selectedEmployee.position}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedEmployee.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Employment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <span className="ml-2 capitalize">{selectedEmployee.department}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hire Date:</span>
                      <span className="ml-2">{format(selectedEmployee.hireDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedEmployee.status)}`}>
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salary:</span>
                      <span className="ml-2">${selectedEmployee.salary.toLocaleString()}/year</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Performance</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Star className={`h-5 w-5 ${getPerformanceColor(selectedEmployee.performanceRating)}`} />
                    <span className="font-medium">{selectedEmployee.performanceRating.toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={(selectedEmployee.performanceRating / 5) * 100} className="flex-1 h-2" />
                </div>
              </div>

              {selectedEmployee.skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEmployee.certifications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="bg-blue-50 text-blue-700">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Emergency Contact</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2">{selectedEmployee.emergencyContact.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2">{selectedEmployee.emergencyContact.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Relationship:</span>
                    <span className="ml-2">{selectedEmployee.emergencyContact.relationship}</span>
                  </div>
                </div>
              </div>

              {selectedEmployee.notes && (
                <div>
                  <h4 className="font-medium mb-3">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsEditEmployeeOpen(true)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
