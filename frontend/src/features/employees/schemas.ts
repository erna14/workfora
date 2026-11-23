import { z } from 'zod'
import { EMPLOYEE_STATUSES } from '../../types/employee'

export const employeeFormSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  workEmail: z.email('Enter a valid work email'),
  personalEmail: z.union([z.literal(''), z.email('Enter a valid email')]).optional(),
  phone: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUSES),
  hireDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  teamId: z.string().optional(),
  managerId: z.string().optional(),
  locationId: z.string().optional(),
  jobTitle: z.string().optional(),
})

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>
