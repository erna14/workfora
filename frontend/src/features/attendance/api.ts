import { api } from '../../services/apiClient'
import type { ApiResponse, PageParams, PageResponse } from '../../types/api'
import { toSearchParams } from '../../utils/queryParams'
import type { AttendanceOverview, AttendanceRecord, AttendanceToday } from './types'

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data
  }
  return response as T
}

export async function fetchAttendanceToday(): Promise<AttendanceToday> {
  const response = await api.get<ApiResponse<AttendanceToday> | AttendanceToday>('/attendance/today')
  return unwrap(response)
}

export async function fetchAttendanceHistory(
  params: PageParams & { from?: string; to?: string },
): Promise<PageResponse<AttendanceRecord>> {
  const qs = toSearchParams({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'workDate,desc',
    from: params.from,
    to: params.to,
  })
  return api.get<PageResponse<AttendanceRecord>>(`/attendance/history${qs}`)
}

export async function fetchAttendanceOverview(date?: string): Promise<AttendanceOverview> {
  const qs = toSearchParams({ date })
  const response = await api.get<ApiResponse<AttendanceOverview> | AttendanceOverview>(
    `/attendance/overview${qs}`,
  )
  return unwrap(response)
}

export async function fetchAdminAttendance(
  params: PageParams & {
    employeeId?: string
    departmentId?: string
    from?: string
    to?: string
    missingCheckout?: boolean
    lateOnly?: boolean
  },
): Promise<PageResponse<AttendanceRecord>> {
  const qs = toSearchParams({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'workDate,desc',
    employeeId: params.employeeId,
    departmentId: params.departmentId,
    from: params.from,
    to: params.to,
    missingCheckout: params.missingCheckout,
    lateOnly: params.lateOnly,
  })
  return api.get<PageResponse<AttendanceRecord>>(`/admin/attendance${qs}`)
}

export async function checkIn(): Promise<AttendanceRecord> {
  const response = await api.post<ApiResponse<AttendanceRecord> | AttendanceRecord>(
    '/attendance/check-in',
  )
  return unwrap(response)
}

export async function checkOut(): Promise<AttendanceRecord> {
  const response = await api.post<ApiResponse<AttendanceRecord> | AttendanceRecord>(
    '/attendance/check-out',
  )
  return unwrap(response)
}

export async function startBreak(): Promise<AttendanceRecord> {
  const response = await api.post<ApiResponse<AttendanceRecord> | AttendanceRecord>(
    '/attendance/break/start',
  )
  return unwrap(response)
}

export async function endBreak(): Promise<AttendanceRecord> {
  const response = await api.post<ApiResponse<AttendanceRecord> | AttendanceRecord>(
    '/attendance/break/end',
  )
  return unwrap(response)
}
