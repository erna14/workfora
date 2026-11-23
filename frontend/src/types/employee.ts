export const EMPLOYEE_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'ONBOARDING',
  'TERMINATED',
] as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export interface EmployeeListItem {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  workEmail: string
  status: EmployeeStatus
  jobTitle: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionTitle: string | null
  teamId: string | null
  teamName: string | null
  locationId: string | null
  locationName: string | null
  managerId: string | null
  managerName: string | null
  hireDate: string | null
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string | null
  phone: string
  email: string | null
}

export interface EmploymentHistoryItem {
  id: string
  title: string
  departmentName: string | null
  startedOn: string
  endedOn: string | null
  notes: string | null
}

export interface EmployeeDocument {
  id: string
  fileName: string
  contentType: string | null
  category: string | null
  uploadedAt: string
}

export interface EmployeeDetail extends EmployeeListItem {
  personalEmail: string | null
  phone: string | null
  dateOfBirth: string | null
  deactivatedAt: string | null
  emergencyContacts: EmergencyContact[]
  employmentHistory: EmploymentHistoryItem[]
  documents: EmployeeDocument[]
}

export interface EmployeeCreateRequest {
  employeeNumber: string
  firstName: string
  lastName: string
  workEmail: string
  personalEmail?: string | null
  phone?: string | null
  status: EmployeeStatus
  hireDate?: string | null
  dateOfBirth?: string | null
  departmentId?: string | null
  positionId?: string | null
  teamId?: string | null
  managerId?: string | null
  locationId?: string | null
  jobTitle?: string | null
}

export type EmployeeUpdateRequest = Partial<EmployeeCreateRequest>
