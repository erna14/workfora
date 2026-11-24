import { describe, expect, it } from 'vitest'
import { accountStepSchema, organizationStepSchema, setupStepSchema } from './schemas'

describe('registration schemas', () => {
  it('accepts a valid account step', () => {
    const result = accountStepSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Admin123!',
      confirmPassword: 'Admin123!',
      acceptTerms: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects weak passwords and mismatched confirmation', () => {
    const weak = accountStepSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'password',
      confirmPassword: 'password',
      acceptTerms: true,
    })
    expect(weak.success).toBe(false)

    const mismatch = accountStepSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Admin123!',
      confirmPassword: 'Admin123?',
      acceptTerms: true,
    })
    expect(mismatch.success).toBe(false)
  })

  it('requires organization fields', () => {
    const result = organizationStepSchema.safeParse({
      name: '',
      companyEmail: 'bad',
      industry: '',
      companySize: '',
      country: '',
      timezone: '',
      website: '',
      phone: '',
    })
    expect(result.success).toBe(false)
  })

  it('allows skipping optional setup lists', () => {
    const result = setupStepSchema.safeParse({
      departments: '',
      locations: '',
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      workStartTime: '09:00',
      workEndTime: '17:00',
    })
    expect(result.success).toBe(true)
  })
})
