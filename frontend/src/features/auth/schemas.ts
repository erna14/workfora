import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

const passwordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a special character')

export const accountStepBaseSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.email('Enter a valid work email'),
  password: passwordComplexity,
  confirmPassword: z.string().min(1, 'Confirm your password'),
  acceptTerms: z.boolean().refine((v) => v, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  }),
})

export const accountStepSchema = accountStepBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  },
)

export const organizationStepSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required').max(200),
  companyEmail: z.email('Enter a valid company email'),
  industry: z.string().trim().min(1, 'Select an industry'),
  companySize: z.string().trim().min(1, 'Select company size'),
  country: z.string().trim().min(1, 'Select a country'),
  timezone: z.string().trim().min(1, 'Select a time zone'),
  website: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^https?:\/\/.+/i.test(v) || /^[\w.-]+\.[\w.-]+/.test(v), {
      message: 'Enter a valid website',
    }),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
})

export const setupStepSchema = z.object({
  departments: z.string().optional().or(z.literal('')),
  locations: z.string().optional().or(z.literal('')),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  workStartTime: z.string().min(1),
  workEndTime: z.string().min(1),
})

export type AccountStepValues = z.infer<typeof accountStepSchema>
export type OrganizationStepValues = z.infer<typeof organizationStepSchema>
export type SetupStepValues = z.infer<typeof setupStepSchema>
