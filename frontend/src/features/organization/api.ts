import { api } from '../../services/apiClient'
import type { ApiResponse, PageParams, PageResponse } from '../../types/api'
import type { Department, Location, Position, Team } from '../../types/organization'
import { toSearchParams } from '../../utils/queryParams'

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data
  }
  return response as T
}

function listPath(resource: string, params: PageParams = {}) {
  return `${resource}${toSearchParams({
    page: params.page ?? 0,
    size: params.size ?? 50,
    sort: params.sort,
    search: params.search,
  })}`
}

export async function fetchDepartments(params?: PageParams) {
  return api.get<PageResponse<Department>>(listPath('/departments', params))
}

export async function fetchPositions(params?: PageParams) {
  return api.get<PageResponse<Position>>(listPath('/positions', params))
}

export async function fetchTeams(params?: PageParams) {
  return api.get<PageResponse<Team>>(listPath('/teams', params))
}

export async function fetchLocations(params?: PageParams) {
  return api.get<PageResponse<Location>>(listPath('/locations', params))
}

export async function createDepartment(payload: Partial<Department>) {
  return unwrap(await api.post<ApiResponse<Department> | Department>('/departments', payload))
}

export async function createPosition(payload: Partial<Position>) {
  return unwrap(await api.post<ApiResponse<Position> | Position>('/positions', payload))
}

export async function createTeam(payload: Partial<Team>) {
  return unwrap(await api.post<ApiResponse<Team> | Team>('/teams', payload))
}

export async function createLocation(payload: Partial<Location>) {
  return unwrap(await api.post<ApiResponse<Location> | Location>('/locations', payload))
}
