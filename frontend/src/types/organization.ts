export interface Department {
  id: string
  code: string
  name: string
  description: string | null
  parentId: string | null
  organizationId: string
}

export interface Position {
  id: string
  title: string
  level: string | null
  description: string | null
  departmentId: string
  departmentName?: string | null
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
