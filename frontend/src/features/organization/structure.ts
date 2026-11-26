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

export const departmentSortOptions: SelectOption[] = [
  { value: 'name,asc', label: 'Name (A–Z)' },
  { value: 'name,desc', label: 'Name (Z–A)' },
  { value: 'code,asc', label: 'Code (A–Z)' },
  { value: 'code,desc', label: 'Code (Z–A)' },
  { value: 'status,asc', label: 'Status (active first)' },
  { value: 'status,desc', label: 'Status (inactive first)' },
  { value: 'updatedAt,desc', label: 'Recently updated' },
  { value: 'updatedAt,asc', label: 'Least recently updated' },
]

export const positionSortOptions: SelectOption[] = [
  { value: 'title,asc', label: 'Title (A–Z)' },
  { value: 'title,desc', label: 'Title (Z–A)' },
  { value: 'level,asc', label: 'Level (A–Z)' },
  { value: 'level,desc', label: 'Level (Z–A)' },
  { value: 'status,asc', label: 'Status (active first)' },
  { value: 'status,desc', label: 'Status (inactive first)' },
  { value: 'updatedAt,desc', label: 'Recently updated' },
  { value: 'updatedAt,asc', label: 'Least recently updated' },
]

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

export interface DepartmentBulkPatch {
  status?: OrgUnitStatus
  managerEmployeeId?: string | null
}

export interface PositionBulkPatch {
  status?: OrgUnitStatus
  departmentId?: string
  level?: string | null
}

export function departmentBulkPatch(values: { status: string; manager: string }): DepartmentBulkPatch | null {
  const patch: DepartmentBulkPatch = {}
  if (values.status === 'ACTIVE' || values.status === 'INACTIVE') patch.status = values.status
  if (values.manager === '__clear__') patch.managerEmployeeId = null
  else if (values.manager && values.manager !== '__keep__') patch.managerEmployeeId = values.manager
  return patch.status === undefined && patch.managerEmployeeId === undefined ? null : patch
}

export function positionBulkPatch(values: {
  status: string
  departmentId: string
  levelMode: string
  level: string
}): PositionBulkPatch | null {
  const patch: PositionBulkPatch = {}
  if (values.status === 'ACTIVE' || values.status === 'INACTIVE') patch.status = values.status
  if (values.departmentId && values.departmentId !== '__keep__') patch.departmentId = values.departmentId
  if (values.levelMode === 'clear') patch.level = null
  if (values.levelMode === 'set') patch.level = values.level.trim()
  return patch.status === undefined && patch.departmentId === undefined && patch.level === undefined ? null : patch
}

export function departmentWriteFromBulk(department: Department, patch: DepartmentBulkPatch) {
  return {
    code: department.code,
    name: department.name,
    description: department.description,
    parentId: department.parentId,
    managerEmployeeId:
      patch.managerEmployeeId === undefined ? department.managerEmployeeId : patch.managerEmployeeId,
    status: patch.status ?? department.status,
  }
}

export function positionWriteFromBulk(position: Position, patch: PositionBulkPatch) {
  return {
    departmentId: patch.departmentId ?? position.departmentId,
    title: position.title,
    level: patch.level === undefined ? position.level : patch.level,
    description: position.description,
    status: patch.status ?? position.status,
  }
}

export async function settleBulk(
  jobs: Array<{ id: string; label: string; run: () => Promise<void> }>,
  message: (error: unknown) => string,
): Promise<{ succeededIds: string[]; failures: string[] }> {
  const succeededIds: string[] = []
  const failures: string[] = []
  for (const job of jobs) {
    try {
      await job.run()
      succeededIds.push(job.id)
    } catch (error) {
      failures.push(`${job.label}: ${message(error)}`)
    }
  }
  return { succeededIds, failures }
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

export function bulkDeleteConfirmation(kind: 'department' | 'position', names: string[]) {
  if (names.length <= 1) return deleteConfirmation(kind, names[0] ?? kind)
  const noun = kind === 'department' ? 'departments' : 'positions'
  const preview = names.slice(0, 6).join(', ')
  const rest = names.length > 6 ? `, and ${names.length - 6} more` : ''
  return {
    title: `Delete ${names.length} ${noun}?`,
    body: `This permanently removes ${preview}${rest}. Records that employees or other organization data still use stay in place. Deactivate those instead.`,
  }
}
