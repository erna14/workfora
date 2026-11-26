import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
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
  settleBulk,
  type BulkSettlement,
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
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: ['teams', organizationId],
    queryFn: () => fetchTeams({ page: 0, size: 100 }),
    enabled: Boolean(organizationId),
  })
}

export function useLocationsQuery() {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: ['locations', organizationId],
    queryFn: () => fetchLocations({ page: 0, size: 100 }),
    enabled: Boolean(organizationId),
  })
}

function useInvalidateStructure() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['departments'] })
    void queryClient.invalidateQueries({ queryKey: ['positions'] })
  }
}

function useRefreshStructure() {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['departments'] })
    await queryClient.invalidateQueries({ queryKey: ['positions'] })
  }, [queryClient])
}

interface BulkItem {
  id: string
  label: string
}

async function settleAndRefresh(
  jobs: Array<BulkItem & { run: () => Promise<void> }>,
  refresh: () => Promise<void>,
): Promise<BulkSettlement> {
  const result = await settleBulk(jobs, errorMessage)
  if (result.succeededIds.length > 0) await refresh()
  return result
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

export function useBulkDeleteDepartmentsMutation() {
  const organizationId = useOrganizationId()
  const refresh = useRefreshStructure()
  return useMutation({
    mutationFn: (items: BulkItem[]) =>
      settleAndRefresh(
        items.map((item) => ({
          ...item,
          run: () => deleteDepartment(item.id, organizationId ?? undefined),
        })),
        refresh,
      ),
  })
}

export function useBulkUpdateDepartmentsMutation() {
  const organizationId = useOrganizationId()
  const refresh = useRefreshStructure()
  return useMutation({
    mutationFn: (items: Array<BulkItem & { payload: DepartmentWrite }>) =>
      settleAndRefresh(
        items.map((item) => ({
          id: item.id,
          label: item.label,
          run: () => updateDepartment(item.id, item.payload, organizationId ?? undefined).then(() => undefined),
        })),
        refresh,
      ),
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

export function useBulkDeletePositionsMutation() {
  const organizationId = useOrganizationId()
  const refresh = useRefreshStructure()
  return useMutation({
    mutationFn: (items: BulkItem[]) =>
      settleAndRefresh(
        items.map((item) => ({
          ...item,
          run: () => deletePosition(item.id, organizationId ?? undefined),
        })),
        refresh,
      ),
  })
}

export function useBulkUpdatePositionsMutation() {
  const organizationId = useOrganizationId()
  const refresh = useRefreshStructure()
  return useMutation({
    mutationFn: (items: Array<BulkItem & { payload: PositionWrite }>) =>
      settleAndRefresh(
        items.map((item) => ({
          id: item.id,
          label: item.label,
          run: () => updatePosition(item.id, item.payload, organizationId ?? undefined).then(() => undefined),
        })),
        refresh,
      ),
  })
}
