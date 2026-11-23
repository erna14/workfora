export type AttendanceSessionState = 'NOT_CHECKED_IN' | 'WORKING' | 'ON_BREAK' | 'COMPLETED'

export interface BreakRecord {
  id: string
  attendanceRecordId: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string | null
  workDate: string
  checkInAt: string | null
  checkOutAt: string | null
  status: string
  sessionState: AttendanceSessionState | string
  totalBreakSeconds: number
  grossWorkSeconds: number | null
  netWorkSeconds: number | null
  lateMinutes: number
  overtimeMinutes: number
  earlyDepartureMinutes: number
  late: boolean
  overtime: boolean
  earlyDeparture: boolean
  missingCheckout: boolean
  timezone: string
  notes: string | null
  breaks: BreakRecord[]
}

export interface AttendanceToday {
  sessionState: AttendanceSessionState | string
  serverTime: string
  record: AttendanceRecord | null
  activeBreak: BreakRecord | null
  elapsedGrossSeconds: number
  elapsedBreakSeconds: number
  elapsedNetSeconds: number
}

export interface AttendanceOverview {
  date: string
  presentCount: number
  workingCount: number
  onBreakCount: number
  completedCount: number
  missingCheckoutCount: number
  lateCount: number
}
