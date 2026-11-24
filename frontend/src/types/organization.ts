export const ORG_UNIT_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export type OrgUnitStatus = (typeof ORG_UNIT_STATUSES)[number]

export interface Department {
  id: string
  code: string
  name: string
  description: string | null
  parentId: string | null
  organizationId: string
  managerEmployeeId: string | null
  managerName: string | null
  status: OrgUnitStatus
  employeeCount: number
  positionCount: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentWrite {
  code: string
  name: string
  description?: string | null
  parentId?: string | null
  managerEmployeeId?: string | null
  status?: OrgUnitStatus
}

export interface Position {
  id: string
  title: string
  level: string | null
  description: string | null
  departmentId: string
  departmentName: string | null
  organizationId: string
  status: OrgUnitStatus
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export interface PositionWrite {
  departmentId: string
  title: string
  level?: string | null
  description?: string | null
  status?: OrgUnitStatus
}

export interface Team {
  id: string
  name: string
  description: string | null
  departmentId: string
  departmentName?: string | null
}

export interface Location {
  id: string
  name: string
  addressLine1: string | null
  city: string | null
  country: string | null
  timezone: string
  organizationId: string
}
