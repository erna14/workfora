import { api } from '../../services/apiClient'
import type { ApiResponse } from '../../types/api'
import type { DashboardSummary } from '../../types/dashboard'

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<ApiResponse<DashboardSummary> | DashboardSummary>(
    '/dashboard/summary',
  )
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data
  }
  return response as DashboardSummary
}
