export interface DashboardSummary {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  newHires: number
  onLeave: number
  pendingLeaveRequests: number
  openJobPostings: number
  unreadNotifications: number
  attendanceToday: {
    present: number
    late: number
    absent: number
  }
  headcountByDepartment: Array<{ name: string; count: number }>
  leaveByMonth: Array<{ month: string; count: number }>
  upcomingBirthdays: Array<{
    employeeId: string
    name: string
    date: string
  }>
  upcomingAnniversaries: Array<{
    employeeId: string
    name: string
    date: string
    years: number
  }>
  recentActivities: Array<{
    id: string
    action: string
    entityType: string | null
    details: string | null
    createdAt: string
  }>
}
