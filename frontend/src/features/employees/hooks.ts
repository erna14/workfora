import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../app/providers/AuthProvider'
import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  fetchEmployee,
  fetchEmployees,
  updateEmployee,
  type EmployeeListParams,
} from './api'
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from '../../types/employee'
import { errorMessage } from '../../utils/format'

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
}

export function useEmployeesQuery(params: EmployeeListParams) {
  const organizationId = useAuth().user?.organizationId ?? null
  return useQuery({
    queryKey: [...employeeKeys.list(params), organizationId],
    queryFn: () => fetchEmployees(params),
    enabled: Boolean(organizationId),
  })
}

export function useEmployeeQuery(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Employee id is required')
      return fetchEmployee(id)
    },
    enabled: Boolean(id),
  })
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeCreateRequest) => createEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
      notifications.show({ color: 'green', message: 'Employee created' })
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: errorMessage(error) })
    },
  })
}

export function useUpdateEmployeeMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeUpdateRequest) => updateEmployee(id, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      void queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.setQueryData(employeeKeys.detail(id), data)
      notifications.show({ color: 'green', message: 'Employee updated' })
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: errorMessage(error) })
    },
  })
}

export function useDeactivateEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateEmployee(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
      notifications.show({ color: 'green', message: 'Employee deactivated' })
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: errorMessage(error) })
    },
  })
}

export function useActivateEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateEmployee(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
      notifications.show({ color: 'green', message: 'Employee activated' })
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: errorMessage(error) })
    },
  })
}
