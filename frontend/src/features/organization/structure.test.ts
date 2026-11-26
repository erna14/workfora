import { describe, expect, it } from 'vitest'
import { departmentFormSchema, positionFormSchema } from './schemas'
import {
  activeDepartmentOptions,
  activePositionOptions,
  bulkDeleteConfirmation,
  deleteConfirmation,
  departmentBulkPatch,
  departmentQueryKey,
  departmentWriteFromBulk,
  positionBulkPatch,
  positionQueryKey,
  positionWriteFromBulk,
  resolveDepartmentSelection,
  settleBulk,
} from './structure'
import type { Department, Position } from '../../types/organization'

const orgA = 'org-a'
const orgB = 'org-b'

function department(overrides: Partial<Department>): Department {
  return {
    id: 'dept-1',
    code: 'ENG',
    name: 'Engineering',
    description: null,
    parentId: null,
    organizationId: orgA,
    managerEmployeeId: null,
    managerName: null,
    status: 'ACTIVE',
    employeeCount: 0,
    positionCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function position(overrides: Partial<Position>): Position {
  return {
    id: 'pos-1',
    title: 'Software Engineer',
    level: 'IC3',
    description: null,
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    organizationId: orgA,
    status: 'ACTIVE',
    employeeCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('department and position organization scoping', () => {
  it('includes the organization id in list query keys so a switch cannot reuse the previous cache', () => {
    const filters = { page: 0, size: 20, search: 'eng' }
    expect(departmentQueryKey(orgA, filters)).not.toEqual(departmentQueryKey(orgB, filters))
    expect(positionQueryKey(orgA, { ...filters, departmentId: 'dept-1' })[1]).toBe(orgA)
  })

  it('loads only active departments from the current organization into the dropdown', () => {
    const options = activeDepartmentOptions(
      [
        department({ id: 'eng', name: 'Engineering', code: 'ENG' }),
        department({ id: 'old', name: 'Archive', code: 'ARC', status: 'INACTIVE' }),
        department({ id: 'sales', name: 'Sales', code: 'SAL', organizationId: orgB }),
      ],
      orgA,
    )
    expect(options).toEqual([{ value: 'eng', label: 'Engineering (ENG)' }])
  })

  it('filters positions by the selected department and drops a stale selection after an organization change', () => {
    const positions = [
      position({ id: 'se', title: 'Software Engineer', departmentId: 'eng' }),
      position({ id: 'mgr', title: 'Manager', departmentId: 'eng', level: null }),
      position({ id: 'other', title: 'Recruiter', departmentId: 'hr' }),
      position({ id: 'foreign', title: 'Seller', departmentId: 'eng', organizationId: orgB }),
      position({ id: 'closed', title: 'Intern', departmentId: 'eng', status: 'INACTIVE' }),
    ]
    expect(activePositionOptions(positions, orgA, 'eng').map((option) => option.value)).toEqual(['se', 'mgr'])
    expect(activePositionOptions(positions, orgB, 'eng').map((option) => option.value)).toEqual(['foreign'])

    const nextOptions = activeDepartmentOptions(
      [department({ id: 'sales', name: 'Sales', code: 'SAL', organizationId: orgB })],
      orgB,
    )
    expect(resolveDepartmentSelection('eng', null)).toBe('eng')
    expect(resolveDepartmentSelection('eng', nextOptions)).toBe('')
    expect(resolveDepartmentSelection('sales', nextOptions)).toBe('sales')
  })

  it('validates department create and edit fields', () => {
    expect(
      departmentFormSchema.safeParse({
        name: 'Human Resources',
        code: 'HR',
        description: 'People operations',
        managerEmployeeId: '',
        status: 'ACTIVE',
      }).success,
    ).toBe(true)
    expect(
      departmentFormSchema.safeParse({
        name: ' ',
        code: '',
        description: '',
        managerEmployeeId: '',
        status: 'ACTIVE',
      }).success,
    ).toBe(false)
  })

  it('requires a department when creating or editing a position', () => {
    expect(
      positionFormSchema.safeParse({
        title: 'Engineering Manager',
        departmentId: 'eng',
        level: 'M2',
        description: '',
        status: 'ACTIVE',
      }).success,
    ).toBe(true)
    expect(
      positionFormSchema.safeParse({
        title: 'Engineering Manager',
        departmentId: '',
        level: '',
        description: '',
        status: 'ACTIVE',
      }).success,
    ).toBe(false)
  })

  it('explains why deletion needs confirmation and when deactivation is the alternative', () => {
    expect(deleteConfirmation('department', 'Engineering').body).toMatch(/deactivate/i)
    expect(deleteConfirmation('position', 'Software Engineer').title).toBe('Delete Software Engineer?')
  })

  it('applies only the bulk fields and keeps each record identity', () => {
    const engineering = department({ id: 'eng', managerEmployeeId: 'mgr-1', status: 'ACTIVE' })
    expect(departmentBulkPatch({ status: '__keep__', manager: '__keep__' })).toBeNull()
    expect(departmentWriteFromBulk(engineering, { status: 'INACTIVE', managerEmployeeId: null })).toMatchObject({
      code: 'ENG',
      name: 'Engineering',
      managerEmployeeId: null,
      status: 'INACTIVE',
    })

    const engineer = position({ id: 'se', title: 'Software Engineer', departmentId: 'eng', level: 'IC3' })
    expect(positionBulkPatch({ status: '__keep__', departmentId: '__keep__', levelMode: '__keep__', level: '' })).toBeNull()
    expect(
      positionWriteFromBulk(engineer, { departmentId: 'hr', level: null, status: 'INACTIVE' }),
    ).toMatchObject({
      title: 'Software Engineer',
      departmentId: 'hr',
      level: null,
      status: 'INACTIVE',
    })
  })

  it('confirms one delete by name and many deletes as a group', () => {
    expect(bulkDeleteConfirmation('department', ['Engineering']).title).toBe('Delete Engineering?')
    expect(bulkDeleteConfirmation('position', ['Engineer', 'Analyst']).title).toBe('Delete 2 positions?')
  })

  it('keeps going when one bulk action fails', async () => {
    const result = await settleBulk(
      [
        { id: 'ok', label: 'Engineering', run: async () => undefined },
        {
          id: 'blocked',
          label: 'Finance',
          run: async () => {
            throw new Error('Employees are still assigned')
          },
        },
      ],
      (error) => (error instanceof Error ? error.message : 'failed'),
    )
    expect(result.succeededIds).toEqual(['ok'])
    expect(result.failures).toEqual(['Finance: Employees are still assigned'])
  })

  it('represents an empty organization as no dropdown options', () => {
    expect(activeDepartmentOptions([], orgA)).toEqual([])
    expect(activePositionOptions([], orgA, null)).toEqual([])
  })
})
