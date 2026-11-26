import { z } from 'zod'
import { ORG_UNIT_STATUSES } from '../../types/organization'

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be 150 characters or fewer'),
  code: z.string().trim().min(1, 'Code is required').max(50, 'Code must be 50 characters or fewer'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer'),
  managerEmployeeId: z.string(),
  status: z.enum(ORG_UNIT_STATUSES),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>

export const positionFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be 150 characters or fewer'),
  departmentId: z.string().min(1, 'Department is required'),
  level: z.string().trim().max(50, 'Level must be 50 characters or fewer'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer'),
  status: z.enum(ORG_UNIT_STATUSES),
})

export type PositionFormValues = z.infer<typeof positionFormSchema>

const bulkStatus = z.union([z.literal('__keep__'), z.enum(ORG_UNIT_STATUSES)])

export const departmentBulkSchema = z
  .object({
    status: bulkStatus,
    manager: z.string(),
  })
  .refine((value) => value.status !== '__keep__' || value.manager !== '__keep__', {
    message: 'Choose at least one change',
    path: ['status'],
  })

export type DepartmentBulkValues = z.infer<typeof departmentBulkSchema>

export const positionBulkSchema = z
  .object({
    status: bulkStatus,
    departmentId: z.string(),
    levelMode: z.enum(['__keep__', 'set', 'clear']),
    level: z.string().trim().max(50, 'Level must be 50 characters or fewer'),
  })
  .refine(
    (value) =>
      value.status !== '__keep__' ||
      (value.departmentId !== '' && value.departmentId !== '__keep__') ||
      value.levelMode !== '__keep__',
    { message: 'Choose at least one change', path: ['status'] },
  )
  .refine((value) => value.levelMode !== 'set' || value.level.length > 0, {
    message: 'Enter a level',
    path: ['level'],
  })

export type PositionBulkValues = z.infer<typeof positionBulkSchema>
