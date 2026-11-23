import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { errorMessage } from '../../utils/format'
import {
  checkIn,
  checkOut,
  endBreak,
  fetchAdminAttendance,
  fetchAttendanceHistory,
  fetchAttendanceOverview,
  fetchAttendanceToday,
  startBreak,
} from './api'
import type { AttendanceRecord } from './types'

export const attendanceKeys = {
  today: ['attendance', 'today'] as const,
  history: (params: unknown) => ['attendance', 'history', params] as const,
  overview: (date?: string) => ['attendance', 'overview', date] as const,
  admin: (params: unknown) => ['attendance', 'admin', params] as const,
}

function invalidateAttendance(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['attendance'] })
}

function notifySuccess(message: string) {
  notifications.show({ color: 'teal', message })
}

function notifyError(error: unknown) {
  notifications.show({ color: 'red', message: errorMessage(error) })
}

export function useAttendanceTodayQuery() {
  return useQuery({
    queryKey: attendanceKeys.today,
    queryFn: fetchAttendanceToday,
    refetchInterval: 60_000,
  })
}

export function useAttendanceHistoryQuery(params: {
  page?: number
  size?: number
  sort?: string
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: attendanceKeys.history(params),
    queryFn: () => fetchAttendanceHistory(params),
  })
}

export function useAttendanceOverviewQuery(date?: string, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.overview(date),
    queryFn: () => fetchAttendanceOverview(date),
    enabled,
  })
}

export function useAdminAttendanceQuery(
  params: {
    page?: number
    size?: number
    sort?: string
    employeeId?: string
    departmentId?: string
    from?: string
    to?: string
    missingCheckout?: boolean
    lateOnly?: boolean
  },
  enabled = true,
) {
  return useQuery({
    queryKey: attendanceKeys.admin(params),
    queryFn: () => fetchAdminAttendance(params),
    enabled,
  })
}

function useAttendanceAction(
  action: () => Promise<AttendanceRecord>,
  successMessage: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      invalidateAttendance(qc)
      notifySuccess(successMessage)
    },
    onError: notifyError,
  })
}

export function useCheckInMutation() {
  return useAttendanceAction(checkIn, 'Checked in successfully')
}

export function useCheckOutMutation() {
  return useAttendanceAction(checkOut, 'Checked out successfully')
}

export function useStartBreakMutation() {
  return useAttendanceAction(startBreak, 'Break started')
}

export function useEndBreakMutation() {
  return useAttendanceAction(endBreak, 'Break ended')
}
