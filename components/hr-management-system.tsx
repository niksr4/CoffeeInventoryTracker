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
import { Calendar } from "@/components/ui/calendar"
import {
  Users,
  UserPlus,
  Clock,
  DollarSign,
  Award,
  TrendingUp,
  CheckCircle,
  Plus,
  Edit,
  Eye,
  Download,
  Search,
  BarChart3,
  Star,
  MapPin,
  Phone,
  Mail,
  Activity,
  Timer,
  Coffee,
  Bell,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: "Field Operations" | "Processing" | "Quality Control" | "Administration" | "Maintenance" | "Sales"
  hireDate: Date
  salary: number
  status: "active" | "inactive" | "on_leave" | "terminated"
  skills: string[]
  certifications: string[]
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  address: string
  profileImage?: string
  performanceRating: number // 1-5 stars
  totalHours: number
  completedTasks: number
  lastActive: Date
}

interface TimeEntry {
  id: string
  employeeId: string
  date: Date
  clockIn: Date
  clockOut?: Date
  breakTime: number // minutes
  totalHours: number
  taskDescription: string
  location: string
  status: "active" | "completed" | "break"
  approvedBy?: string
}

interface LeaveRequest {
  id: string
  employeeId: string
  type: "vacation" | "sick" | "personal" | "emergency"
  startDate: Date
  endDate: Date
  reason: string
  status: "pending" | "approved" | "rejected"
  requestDate: Date
  approvedBy?: string
  notes?: string
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
  strengths: string[]
  areasForImprovement: string[]
  goals: string[]
  reviewerNotes: string
  reviewedBy: string
}

const sampleEmployees: Employee[] = [
  {
    id: "emp-1",
    name: "Rajesh Kumar",
    email: "rajesh@honeyfarm.com",
    phone: "+91 98765 43210",
    position: "Senior Beekeeper",
    department: "Field Operations",
    hireDate: new Date("2022-03-15"),
    salary: 35000,
    status: "active",
    skills: ["Hive Management", "Queen Rearing", "Honey Extraction", "Disease Control"],
    certifications: ["Certified Beekeeper", "Organic Farming"],
    emergencyContact: {
      name: "Sunita Kumar",
      phone: "+91 98765 43211",
      relationship: "Spouse",
    },
    address: "123 Village Road, Bangalore Rural",
    performanceRating: 4.5,
    totalHours: 2080,
    completedTasks: 156,
    lastActive: new Date(),
  },
  {
    id: "emp-2",
    name: "Priya Sharma",
    email: "priya@honeyfarm.com",
    phone: "+91 98765 43212",
    position: "Quality Control Specialist",
    department: "Quality Control",
    hireDate: new Date("2023-01-10"),
    salary: 28000,
    status: "active",
    skills: ["Quality Testing", "Lab Analysis", "Documentation", "Food Safety"],
    certifications: ["Food Safety Certification", "Quality Management"],
    emergencyContact: {
      name: "Amit Sharma",
      phone: "+91 98765 43213",
      relationship: "Father",
    },
    address: "456 Tech Park, Bangalore",
    performanceRating: 4.8,
    totalHours: 1560,
    completedTasks: 89,
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "emp-3",
    name: "Mohammed Ali",
    email: "mohammed@honeyfarm.com",
    phone: "+91 98765 43214",
    position: "Processing Technician",
    department: "Processing",
    hireDate: new Date("2023-06-20"),
    salary: 25000,
    status: "active",
    skills: ["Honey Processing", "Equipment Maintenance", "Packaging", "Inventory Management"],
    certifications: ["Equipment Operation", "Safety Training"],
    emergencyContact: {
      name: "Fatima Ali",
      phone: "+91 98765 43215",
      relationship: "Spouse",
    },
    address: "789 Industrial Area, Bangalore",
    performanceRating: 4.2,
    totalHours: 1040,
    completedTasks: 67,
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "emp-4",
    name: "Lakshmi Devi",
    email: "lakshmi@honeyfarm.com",
    phone: "+91 98765 43216",
    position: "Field Assistant",
    department: "Field Operations",
    hireDate: new Date("2023-09-01"),
    salary: 20000,
    status: "on_leave",
    skills: ["Hive Inspection", "Data Collection", "Basic Maintenance"],
    certifications: ["Basic Beekeeping"],
    emergencyContact: {
      name: "Ravi Devi",
      phone: "+91 98765 43217",
      relationship: "Husband",
    },
    address: "321 Rural Road, Mysore",
    performanceRating: 4.0,
    totalHours: 520,
    completedTasks: 34,
    lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
]

const sampleTimeEntries: TimeEntry[] = [
  {
    id: "time-1",
    employeeId: "emp-1",
    date: new Date(),
    clockIn: new Date(Date.now() - 8 * 60 * 60 * 1000),
    clockOut: new Date(Date.now() - 30 * 60 * 1000),
    breakTime: 60,
    totalHours: 7.5,
    taskDescription: "Hive inspection and honey collection",
    location: "North Field",
    status: "completed",
    approvedBy: "supervisor",
  },
  {
    id: "time-2",
    employeeId: "emp-2",
    date: new Date(),
    clockIn: new Date(Date.now() - 6 * 60 * 60 * 1000),
    breakTime: 30,
    totalHours: 0,
    taskDescription: "Quality testing of honey samples",
    location: "Lab",
    status: "active",
  },
]

const sampleLeaveRequests: LeaveRequest[] = [
  {
    id: "leave-1",
    employeeId: "emp-4",
    type: "sick",
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    reason: "Medical treatment",
    status: "approved",
    requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    approvedBy: "HR Manager",
    notes: "Medical certificate provided",
  },
  {
    id: "leave-2",
    employeeId: "emp-1",
    type: "vacation",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    reason: "Family vacation",
    status: "pending",
    requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

export default function HRManagementSystem() {
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(sampleTimeEntries)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(sampleLeaveRequests)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog states
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false)
  const [isEmployeeDetailsDialogOpen, setIsEmployeeDetailsDialogOpen] = useState(false)
  const [isTimeTrackingDialogOpen, setIsTimeTrackingDialogOpen] = useState(false)
  const [isLeaveRequestDialogOpen, setIsLeaveRequestDialogOpen] = useState(false)

  // Form states
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Field Operations",
    salary: 0,
    status: "active",
    skills: [],
    certifications: [],
    address: "",
    performanceRating: 3,
  })

  const [newLeaveRequest, setNewLeaveRequest] = useState<Partial<LeaveRequest>>({
    employeeId: "",
    type: "vacation",
    reason: "",
    status: "pending",
  })

  const [clockInData, setClockInData] = useState({
    employeeId: "",
    taskDescription: "",
    location: "",
  })

  const getDepartmentColor = (department: Employee["department"]) => {
    switch (department) {
      case "Field Operations":
        return "bg-green-100 text-green-800 border-green-300"
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Quality Control":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "Administration":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "Maintenance":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "Sales":
        return "bg-pink-100 text-pink-800 border-pink-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusColor = (status: Employee["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300"
      case "on_leave":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "terminated":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getLeaveStatusColor = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.position) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const employee: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmployee.name!,
      email: newEmployee.email!,
      phone: newEmployee.phone || "",
      position: newEmployee.position!,
      department: newEmployee.department!,
      hireDate: new Date(),
      salary: newEmployee.salary || 0,
      status: newEmployee.status!,
      skills: newEmployee.skills || [],
      certifications: newEmployee.certifications || [],
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      address: newEmployee.address || "",
      performanceRating: newEmployee.performanceRating || 3,
      totalHours: 0,
      completedTasks: 0,
      lastActive: new Date(),
    }

    setEmployees([...employees, employee])
    setIsAddEmployeeDialogOpen(false)
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "Field Operations",
      salary: 0,
      status: "active",
      skills: [],
      certifications: [],
      address: "",
      performanceRating: 3,
    })

    toast({
      title: "Employee added",
      description: "New employee has been added successfully",
    })
  }

  const handleClockIn = () => {
    if (!clockInData.employeeId || !clockInData.taskDescription) {
      toast({
        title: "Missing information",
        description: "Please select employee and enter task description",
        variant: "destructive",
      })
      return
    }

    const timeEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      employeeId: clockInData.employeeId,
      date: new Date(),
      clockIn: new Date(),
      breakTime: 0,
      totalHours: 0,
      taskDescription: clockInData.taskDescription,
      location: clockInData.location || "Farm",
      status: "active",
    }

    setTimeEntries([...timeEntries, timeEntry])
    setIsTimeTrackingDialogOpen(false)
    setClockInData({
      employeeId: "",
      taskDescription: "",
      location: "",
    })

    toast({
      title: "Clocked in",
      description: "Employee has been clocked in successfully",
    })
  }

  const handleClockOut = (timeEntryId: string) => {
    setTimeEntries(
      timeEntries.map((entry) => {
        if (entry.id === timeEntryId && entry.status === "active") {
          const clockOut = new Date()
          const totalHours = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60) - entry.breakTime / 60
          return {
            ...entry,
            clockOut,
            totalHours: Math.max(0, totalHours),
            status: "completed" as const,
          }
        }
        return entry
      }),
    )

    toast({
      title: "Clocked out",
      description: "Employee has been clocked out successfully",
    })
  }

  const handleLeaveRequest = () => {
    if (!newLeaveRequest.employeeId || !newLeaveRequest.reason) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const leaveRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: newLeaveRequest.employeeId!,
      type: newLeaveRequest.type!,
      startDate: new Date(),
      endDate: new Date(),
      reason: newLeaveRequest.reason!,
      status: "pending",
      requestDate: new Date(),
    }

    setLeaveRequests([...leaveRequests, leaveRequest])
    setIsLeaveRequestDialogOpen(false)
    setNewLeaveRequest({
      employeeId: "",
      type: "vacation",
      reason: "",
      status: "pending",
    })

    toast({
      title: "Leave request submitted",
      description: "Leave request has been submitted for approval",
    })
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const activeEmployees = employees.filter((emp) => emp.status === "active").length
  const onLeaveEmployees = employees.filter((emp) => emp.status === "on_leave").length
  const pendingLeaveRequests = leaveRequests.filter((req) => req.status === "pending").length
  const activeTimeEntries = timeEntries.filter((entry) => entry.status === "active").length

  const totalPayroll = employees.filter((emp) => emp.status === "active").reduce((sum, emp) => sum + emp.salary, 0)

  const averagePerformance =
    employees.length > 0 ? employees.reduce((sum, emp) => sum + emp.performanceRating, 0) / employees.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">HR Management System</h1>
          <p className="text-muted-foreground">Manage employees, track time, and handle HR operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTimeTrackingDialogOpen(true)} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Clock In/Out
          </Button>
          <Button onClick={() => setIsAddEmployeeDialogOpen(true)} className="bg-primary hover:bg-primary/90">
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
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold text-primary">{activeEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-yellow-600">{onLeaveEmployees}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clocked In</p>
                <p className="text-2xl font-bold text-green-600">{activeTimeEntries}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                <p className="text-2xl font-bold text-blue-600">₹{(totalPayroll / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeEntries.slice(0, 5).map((entry) => {
                    const employee = employees.find((emp) => emp.id === entry.employeeId)
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{employee?.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.taskDescription}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.status === "active" ? "Currently working" : `${entry.totalHours.toFixed(1)} hours`}
                          </p>
                        </div>
                        <Badge
                          className={
                            entry.status === "active" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveRequests
                    .filter((req) => req.status === "pending")
                    .map((request) => {
                      const employee = employees.find((emp) => emp.id === request.employeeId)
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                        >
                          <div>
                            <p className="font-medium">{employee?.name}</p>
                            <p className="text-sm text-muted-foreground">{request.type} leave request</p>
                            <p className="text-xs text-muted-foreground">{request.reason}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 bg-transparent"
                            >
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 bg-transparent">
                              Reject
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  {pendingLeaveRequests === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No pending approvals</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Employee Directory</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddEmployeeDialogOpen(true)} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Field Operations">Field Operations</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{employee.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{employee.position}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setIsEmployeeDetailsDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge className={getDepartmentColor(employee.department)}>{employee.department}</Badge>
                          <Badge className={getStatusColor(employee.status)}>{employee.status.replace("_", " ")}</Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{employee.email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{employee.phone}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(employee.performanceRating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{employee.completedTasks} tasks</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-tracking" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-green-600" />
                  Active Time Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeEntries
                    .filter((entry) => entry.status === "active")
                    .map((entry) => {
                      const employee = employees.find((emp) => emp.id === entry.employeeId)
                      const hoursWorked = (new Date().getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60)

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div>
                            <p className="font-medium">{employee?.name}</p>
                            <p className="text-sm text-muted-foreground">{entry.taskDescription}</p>
                            <p className="text-sm text-green-600">
                              Started: {format(entry.clockIn, "HH:mm")} • {hoursWorked.toFixed(1)} hours
                            </p>
                            <p className="text-xs text-muted-foreground">Location: {entry.location}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-300 bg-transparent"
                            >
                              <Coffee className="h-4 w-4 mr-1" />
                              Break
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleClockOut(entry.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Clock Out
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  {timeEntries.filter((entry) => entry.status === "active").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No active time sessions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Time Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Recent Time Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeEntries
                    .filter((entry) => entry.status === "completed")
                    .slice(0, 5)
                    .map((entry) => {
                      const employee = employees.find((emp) => emp.id === entry.employeeId)

                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{employee?.name}</p>
                            <p className="text-sm text-muted-foreground">{entry.taskDescription}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(entry.date, "MMM dd")} • {entry.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{entry.totalHours.toFixed(1)}h</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.clockIn && format(entry.clockIn, "HH:mm")} -{" "}
                              {entry.clockOut && format(entry.clockOut, "HH:mm")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leave-management" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Leave Management</CardTitle>
                <Button onClick={() => setIsLeaveRequestDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => {
                  const employee = employees.find((emp) => emp.id === request.employeeId)

                  return (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{employee?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                        </p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(request.startDate, "MMM dd")} - {format(request.endDate, "MMM dd")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getLeaveStatusColor(request.status)}>{request.status}</Badge>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 bg-transparent"
                            >
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 bg-transparent">
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Performance Rating</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(averagePerformance) ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{averagePerformance.toFixed(1)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Team Performance</span>
                      <span>{Math.round((averagePerformance / 5) * 100)}%</span>
                    </div>
                    <Progress value={(averagePerformance / 5) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees
                    .sort((a, b) => b.performanceRating - a.performanceRating)
                    .slice(0, 5)
                    .map((employee, index) => (
                      <div key={employee.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-800"
                                : index === 1
                                  ? "bg-gray-100 text-gray-800"
                                  : index === 2
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(employee.performanceRating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{employee.performanceRating}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Payroll Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Monthly Payroll</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalPayroll.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Salary</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{activeEmployees > 0 ? Math.round(totalPayroll / activeEmployees).toLocaleString() : 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold text-purple-600">{activeEmployees}</p>
                </div>
              </div>

              <div className="space-y-4">
                {employees
                  .filter((emp) => emp.status === "active")
                  .map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{employee.salary.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter the employee details to add them to the system</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name *</label>
              <Input
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Position *</label>
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
                onValueChange={(value: Employee["department"]) => setNewEmployee({ ...newEmployee, department: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Field Operations">Field Operations</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Quality Control">Quality Control</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Monthly Salary (₹)</label>
              <Input
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                placeholder="Enter salary amount"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Address</label>
              <Textarea
                value={newEmployee.address}
                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                placeholder="Enter address"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Tracking Dialog */}
      <Dialog open={isTimeTrackingDialogOpen} onOpenChange={setIsTimeTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock In Employee</DialogTitle>
            <DialogDescription>Record employee clock in time and task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <Select
                value={clockInData.employeeId}
                onValueChange={(value) => setClockInData({ ...clockInData, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.status === "active")
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Task Description</label>
              <Textarea
                value={clockInData.taskDescription}
                onChange={(e) => setClockInData({ ...clockInData, taskDescription: e.target.value })}
                placeholder="Describe the task or work to be performed"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={clockInData.location}
                onChange={(e) => setClockInData({ ...clockInData, location: e.target.value })}
                placeholder="Work location (e.g., North Field, Lab, Office)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeTrackingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClockIn}>Clock In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Request Dialog */}
      <Dialog open={isLeaveRequestDialogOpen} onOpenChange={setIsLeaveRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
            <DialogDescription>Create a new leave request for approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <Select
                value={newLeaveRequest.employeeId}
                onValueChange={(value) => setNewLeaveRequest({ ...newLeaveRequest, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.status === "active")
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Leave Type</label>
              <Select
                value={newLeaveRequest.type}
                onValueChange={(value: LeaveRequest["type"]) => setNewLeaveRequest({ ...newLeaveRequest, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <Textarea
                value={newLeaveRequest.reason}
                onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, reason: e.target.value })}
                placeholder="Provide reason for leave request"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLeaveRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={isEmployeeDetailsDialogOpen} onOpenChange={setIsEmployeeDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.position}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getDepartmentColor(selectedEmployee.department)}>
                      {selectedEmployee.department}
                    </Badge>
                    <Badge className={getStatusColor(selectedEmployee.status)}>
                      {selectedEmployee.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEmployee.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Employment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hire Date:</span>
                      <span>{format(selectedEmployee.hireDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary:</span>
                      <span>₹{selectedEmployee.salary.toLocaleString()}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Hours:</span>
                      <span>{selectedEmployee.totalHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasks Completed:</span>
                      <span>{selectedEmployee.completedTasks}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Skills & Certifications</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Certifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.certifications.map((cert) => (
                        <Badge key={cert} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Performance</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rating:</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(selectedEmployee.performanceRating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{selectedEmployee.performanceRating}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmployeeDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
