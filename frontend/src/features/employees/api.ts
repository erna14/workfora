import { api } from '../../services/apiClient'
import type { ApiResponse, PageParams, PageResponse } from '../../types/api'
import type {
  EmployeeCreateRequest,
  EmployeeDetail,
  EmployeeListItem,
  EmployeeStatus,
  EmployeeUpdateRequest,
} from '../../types/employee'
import { toSearchParams } from '../../utils/queryParams'

export interface EmployeeListParams extends PageParams {
  status?: EmployeeStatus | ''
  departmentId?: string
}

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data
  }
  return response as T
}

export async function fetchEmployees(
  params: EmployeeListParams,
): Promise<PageResponse<EmployeeListItem>> {
  const qs = toSearchParams({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort,
    search: params.search,
    status: params.status || undefined,
    departmentId: params.departmentId || undefined,
  })
  return api.get<PageResponse<EmployeeListItem>>(`/employees${qs}`)
}

export async function fetchEmployee(id: string): Promise<EmployeeDetail> {
  const response = await api.get<ApiResponse<EmployeeDetail> | EmployeeDetail>(`/employees/${id}`)
  return unwrap(response)
}

export async function createEmployee(payload: EmployeeCreateRequest): Promise<EmployeeDetail> {
  const response = await api.post<ApiResponse<EmployeeDetail> | EmployeeDetail>(
    '/employees',
    payload,
  )
  return unwrap(response)
}

export async function updateEmployee(
  id: string,
  payload: EmployeeUpdateRequest,
): Promise<EmployeeDetail> {
  const response = await api.patch<ApiResponse<EmployeeDetail> | EmployeeDetail>(
    `/employees/${id}`,
    payload,
  )
  return unwrap(response)
}

export async function deactivateEmployee(id: string): Promise<EmployeeDetail> {
  const response = await api.post<ApiResponse<EmployeeDetail> | EmployeeDetail>(
    `/employees/${id}/deactivate`,
  )
  return unwrap(response)
}

export async function activateEmployee(id: string): Promise<EmployeeDetail> {
  const response = await api.post<ApiResponse<EmployeeDetail> | EmployeeDetail>(
    `/employees/${id}/activate`,
  )
  return unwrap(response)
}
