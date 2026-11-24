import { api } from '../../services/apiClient'
import type { ApiResponse, PageResponse } from '../../types/api'
import type {
  Department,
  DepartmentWrite,
  Location,
  OrgUnitStatus,
  Position,
  PositionWrite,
  Team,
} from '../../types/organization'
import { toSearchParams } from '../../utils/queryParams'
import type { DepartmentListFilters, PositionListFilters } from './structure'

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data
  }
  return response as T
}

export async function fetchDepartments(params: DepartmentListFilters & { organizationId?: string }) {
  return api.get<PageResponse<Department>>(
    `/departments${toSearchParams({
      organizationId: params.organizationId,
      page: params.page,
      size: params.size,
      sort: params.sort ?? 'name,asc',
      search: params.search,
      status: params.status,
    })}`,
  )
}

export async function fetchDepartment(id: string, organizationId?: string) {
  return unwrap(
    await api.get<ApiResponse<Department>>(
      `/departments/${id}${toSearchParams({ organizationId })}`,
    ),
  )
}

export async function createDepartment(payload: DepartmentWrite, organizationId?: string) {
  return unwrap(
    await api.post<ApiResponse<Department>>(
      `/departments${toSearchParams({ organizationId })}`,
      payload,
    ),
  )
}

export async function updateDepartment(id: string, payload: DepartmentWrite, organizationId?: string) {
  return unwrap(
    await api.put<ApiResponse<Department>>(
      `/departments/${id}${toSearchParams({ organizationId })}`,
      payload,
    ),
  )
}

export async function updateDepartmentStatus(id: string, status: OrgUnitStatus, organizationId?: string) {
  return unwrap(
    await api.patch<ApiResponse<Department>>(
      `/departments/${id}/status${toSearchParams({ organizationId })}`,
      { status },
    ),
  )
}

export async function deleteDepartment(id: string, organizationId?: string) {
  await api.delete(`/departments/${id}${toSearchParams({ organizationId })}`)
}

export async function fetchPositions(params: PositionListFilters & { organizationId?: string }) {
  return api.get<PageResponse<Position>>(
    `/positions${toSearchParams({
      organizationId: params.organizationId,
      departmentId: params.departmentId,
      page: params.page,
      size: params.size,
      sort: params.sort ?? 'title,asc',
      search: params.search,
      status: params.status,
    })}`,
  )
}

export async function fetchPosition(id: string, organizationId?: string) {
  return unwrap(
    await api.get<ApiResponse<Position>>(
      `/positions/${id}${toSearchParams({ organizationId })}`,
    ),
  )
}

export async function createPosition(payload: PositionWrite, organizationId?: string) {
  return unwrap(
    await api.post<ApiResponse<Position>>(
      `/positions${toSearchParams({ organizationId })}`,
      payload,
    ),
  )
}

export async function updatePosition(id: string, payload: PositionWrite, organizationId?: string) {
  return unwrap(
    await api.put<ApiResponse<Position>>(
      `/positions/${id}${toSearchParams({ organizationId })}`,
      payload,
    ),
  )
}

export async function updatePositionStatus(id: string, status: OrgUnitStatus, organizationId?: string) {
  return unwrap(
    await api.patch<ApiResponse<Position>>(
      `/positions/${id}/status${toSearchParams({ organizationId })}`,
      { status },
    ),
  )
}

export async function deletePosition(id: string, organizationId?: string) {
  await api.delete(`/positions/${id}${toSearchParams({ organizationId })}`)
}

export async function fetchTeams(params: { page?: number; size?: number; sort?: string; search?: string } = {}) {
  return api.get<PageResponse<Team>>(
    `/teams${toSearchParams({
      page: params.page ?? 0,
      size: params.size ?? 50,
      sort: params.sort,
      search: params.search,
    })}`,
  )
}

export async function fetchLocations(params: { page?: number; size?: number; sort?: string; search?: string } = {}) {
  return api.get<PageResponse<Location>>(
    `/locations${toSearchParams({
      page: params.page ?? 0,
      size: params.size ?? 50,
      sort: params.sort,
      search: params.search,
    })}`,
  )
}

export async function createTeam(payload: Partial<Team>) {
  return unwrap(await api.post<ApiResponse<Team> | Team>('/teams', payload))
}

export async function createLocation(payload: Partial<Location>) {
  return unwrap(await api.post<ApiResponse<Location> | Location>('/locations', payload))
}
