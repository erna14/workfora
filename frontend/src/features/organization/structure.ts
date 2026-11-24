import type { Department, OrgUnitStatus, Position } from '../../types/organization'

export interface DepartmentListFilters {
  page: number
  size: number
  search?: string
  status?: OrgUnitStatus
  sort?: string
}

export interface PositionListFilters {
  page: number
  size: number
  search?: string
  status?: OrgUnitStatus
  departmentId?: string
  sort?: string
}

export interface SelectOption {
  value: string
  label: string
}

export function departmentQueryKey(
  organizationId: string | null,
  filters: DepartmentListFilters,
) {
  return ['departments', organizationId, filters] as const
}

export function positionQueryKey(organizationId: string | null, filters: PositionListFilters) {
  return ['positions', organizationId, filters] as const
}

export function activeDepartmentOptions(
  departments: Department[],
  organizationId: string | null,
): SelectOption[] {
  if (!organizationId) return []
  return departments
    .filter((department) => department.organizationId === organizationId && department.status === 'ACTIVE')
    .map((department) => ({
      value: department.id,
      label: `${department.name} (${department.code})`,
    }))
}

export function activePositionOptions(
  positions: Position[],
  organizationId: string | null,
  departmentId: string | null,
): SelectOption[] {
  if (!organizationId || !departmentId) return []
  return positions
    .filter(
      (position) =>
        position.organizationId === organizationId &&
        position.departmentId === departmentId &&
        position.status === 'ACTIVE',
    )
    .map((position) => ({
      value: position.id,
      label: position.level ? `${position.title} · ${position.level}` : position.title,
    }))
}

/** Keep the current selection while options are still loading. Clear it when it is not in the active list. */
export function resolveDepartmentSelection(
  current: string,
  options: SelectOption[] | null,
): string {
  if (!current || options === null) return current
  return options.some((option) => option.value === current) ? current : ''
}

export function deleteConfirmation(kind: 'department' | 'position', name: string) {
  if (kind === 'department') {
    return {
      title: `Delete ${name}?`,
      body: 'This permanently removes the department. If employees, positions, teams, or job openings still use it, deletion is blocked and you should deactivate it instead.',
    }
  }
  return {
    title: `Delete ${name}?`,
    body: 'This permanently removes the position. If employees are still assigned to it, deletion is blocked and you should deactivate it instead.',
  }
}
