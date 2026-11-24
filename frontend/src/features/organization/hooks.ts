import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../app/providers/AuthProvider'
import type { DepartmentWrite, OrgUnitStatus, PositionWrite } from '../../types/organization'
import { errorMessage } from '../../utils/format'
import {
  createDepartment,
  createPosition,
  deleteDepartment,
  deletePosition,
  fetchDepartments,
  fetchLocations,
  fetchPositions,
  fetchTeams,
  updateDepartment,
  updateDepartmentStatus,
  updatePosition,
  updatePositionStatus,
} from './api'
import {
  departmentQueryKey,
  positionQueryKey,
  type DepartmentListFilters,
  type PositionListFilters,
} from './structure'

function useOrganizationId() {
  return useAuth().user?.organizationId ?? null
}

export function useDepartmentListQuery(filters: DepartmentListFilters) {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: departmentQueryKey(organizationId, filters),
    queryFn: () => fetchDepartments({ ...filters, organizationId: organizationId ?? undefined }),
    enabled: Boolean(organizationId),
  })
}

export function useDepartmentsQuery(options?: { activeOnly?: boolean }) {
  return useDepartmentListQuery({
    page: 0,
    size: 100,
    status: options?.activeOnly ? 'ACTIVE' : undefined,
  })
}

export function usePositionListQuery(filters: PositionListFilters) {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: positionQueryKey(organizationId, filters),
    queryFn: () => fetchPositions({ ...filters, organizationId: organizationId ?? undefined }),
    enabled: Boolean(organizationId),
  })
}

export function usePositionsQuery(options?: { activeOnly?: boolean; departmentId?: string }) {
  return usePositionListQuery({
    page: 0,
    size: 100,
    status: options?.activeOnly ? 'ACTIVE' : undefined,
    departmentId: options?.departmentId,
  })
}

export function useTeamsQuery() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams({ page: 0, size: 100 }),
  })
}

export function useLocationsQuery() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => fetchLocations({ page: 0, size: 100 }),
  })
}

function useInvalidateStructure() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['departments'] })
    void queryClient.invalidateQueries({ queryKey: ['positions'] })
  }
}

export function useCreateDepartmentMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: (payload: DepartmentWrite) =>
      createDepartment(payload, organizationId ?? undefined),
    onSuccess: invalidate,
  })
}

export function useUpdateDepartmentMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DepartmentWrite }) =>
      updateDepartment(id, payload, organizationId ?? undefined),
    onSuccess: invalidate,
  })
}

export function useDepartmentStatusMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrgUnitStatus }) =>
      updateDepartmentStatus(id, status, organizationId ?? undefined),
    onSuccess: invalidate,
    onError: (error) => {
      notifications.show({ color: 'red', message: errorMessage(error) })
    },
  })
}

export function useDeleteDepartmentMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id, organizationId ?? undefined),
    onSuccess: invalidate,
  })
}

export function useCreatePositionMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: (payload: PositionWrite) => createPosition(payload, organizationId ?? undefined),
    onSuccess: invalidate,
  })
}

export function useUpdatePositionMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PositionWrite }) =>
      updatePosition(id, payload, organizationId ?? undefined),
    onSuccess: invalidate,
  })
}

export function usePositionStatusMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrgUnitStatus }) =>
      updatePositionStatus(id, status, organizationId ?? undefined),
    onSuccess: invalidate,
    onError: (error) => {
      notifications.show({ color: 'red', message: errorMessage(error) })
    },
  })
}

export function useDeletePositionMutation() {
  const organizationId = useOrganizationId()
  const invalidate = useInvalidateStructure()
  return useMutation({
    mutationFn: (id: string) => deletePosition(id, organizationId ?? undefined),
    onSuccess: invalidate,
  })
}
