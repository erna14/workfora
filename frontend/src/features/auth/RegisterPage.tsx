import {
  Anchor,
  Button,
  Checkbox,
  MultiSelect,
  PasswordInput,
  Select,
  TextInput,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../../app/providers/AuthProvider'
import { ApiError } from '../../types/api'
import type { RegistrationResponse } from '../../types/auth'
import { registerOrganization } from './api'
import {
  accountStepBaseSchema,
  accountStepSchema,
  organizationStepSchema,
  setupStepSchema,
  type AccountStepValues,
  type OrganizationStepValues,
  type SetupStepValues,
} from './schemas'
import classes from './RegisterPage.module.css'

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Professional Services',
  'Other',
].map((v) => ({ value: v, label: v }))

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map((v) => ({
  value: v,
  label: v,
}))

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'BA', label: 'Bosnia and Herzegovina' },
  { value: 'IN', label: 'India' },
  { value: 'Other', label: 'Other' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Sarajevo',
  'Asia/Kolkata',
  'Australia/Sydney',
].map((v) => ({ value: v, label: v }))

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((v) => ({
  value: v,
  label: v,
}))

const STEP_LABELS = ['Account', 'Organization', 'Setup', 'Done']

function formatFieldError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (!error) continue
    if (typeof error === 'string') return error
    if (typeof error === 'object' && 'message' in error) {
      const message = (error as { message: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
  }
  return undefined
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value || !value.trim()) return undefined
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export default function RegisterPage() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const [step, setStep] = useState(0)
  const [account, setAccount] = useState<AccountStepValues | null>(null)
  const [organization, setOrganization] = useState<OrganizationStepValues | null>(null)
  const [result, setResult] = useState<RegistrationResponse | null>(null)

  const mutation = useMutation({
    mutationFn: registerOrganization,
    onSuccess: (data) => {
      setResult(data)
      setStep(3)
    },
    onError: (error) => {
      let message = 'Unable to complete registration. Please try again.'
      if (error instanceof ApiError) {
        if (error.status === 409) {
          message = 'An account with this email already exists.'
        } else if (error.message) {
          message = error.message
        }
      }
      notifications.show({ color: 'red', title: 'Registration failed', message })
    },
  })

  const accountForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as boolean,
    },
    onSubmit: async ({ value }) => {
      const parsed = accountStepSchema.safeParse(value)
      if (!parsed.success) return
      setAccount(parsed.data)
      setStep(1)
    },
  })

  const organizationForm = useForm({
    defaultValues: {
      name: '',
      companyEmail: '',
      industry: '',
      companySize: '',
      country: '',
      timezone: 'UTC',
      website: '',
      phone: '',
    } satisfies OrganizationStepValues,
    onSubmit: async ({ value }) => {
      const parsed = organizationStepSchema.safeParse(value)
      if (!parsed.success) return
      setOrganization(parsed.data)
      setStep(2)
    },
  })

  const setupForm = useForm({
    defaultValues: {
      departments: '',
      locations: '',
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      workStartTime: '09:00',
      workEndTime: '17:00',
    } satisfies SetupStepValues,
    onSubmit: async ({ value }) => {
      if (!account || !organization || mutation.isPending) return
      const parsed = setupStepSchema.safeParse(value)
      if (!parsed.success) return

      mutation.mutate({
        account: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email.trim(),
          password: account.password,
          confirmPassword: account.confirmPassword,
          acceptTerms: account.acceptTerms,
        },
        organization: {
          name: organization.name,
          companyEmail: organization.companyEmail.trim(),
          industry: organization.industry,
          companySize: organization.companySize,
          country: organization.country,
          timezone: organization.timezone,
          website: organization.website || undefined,
          phone: organization.phone || undefined,
        },
        setup: {
          departments: splitCsv(parsed.data.departments),
          locations: splitCsv(parsed.data.locations),
          workingDays: parsed.data.workingDays,
          workStartTime: parsed.data.workStartTime,
          workEndTime: parsed.data.workEndTime,
        },
      })
    },
  })

  if (isBootstrapping) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className={classes.form}>
      <header className={classes.header}>
        <h1 className={classes.title}>
          {step === 3 ? 'Check your email' : 'Create your organization'}
        </h1>
        <p className={classes.subtitle}>
          {step === 3
            ? 'We sent a verification link so you can activate your workspace.'
            : 'Register your company and become its organization administrator.'}
        </p>
      </header>

      <div className={classes.steps} aria-hidden>
        {STEP_LABELS.map((label, index) => (
          <div
            key={label}
            className={classes.stepDot}
            data-active={index === step || undefined}
            data-done={index < step || undefined}
          />
        ))}
      </div>

      {step < 3 ? <p className={classes.stepLabel}>Step {step + 1} of 3 · {STEP_LABELS[step]}</p> : null}

      {step === 0 ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void accountForm.handleSubmit()
          }}
        >
          <div className={classes.fields}>
            <accountForm.Subscribe selector={(s) => s.submissionAttempts}>
              {(attempts) => {
                const show = attempts > 0
                return (
                  <>
                    <div className={classes.grid2}>
                      <accountForm.Field
                        name="firstName"
                        validators={{
                          onSubmit: ({ value }) => (value.trim() ? undefined : 'First name is required'),
                        }}
                      >
                        {(field) => {
                          const message = formatFieldError(field.state.meta.errors)
                          return (
                            <div className={classes.field}>
                              <TextInput
                                label="First name"
                                size="md"
                                radius="md"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.currentTarget.value)}
                                error={show && Boolean(message)}
                                classNames={{ label: classes.label, input: classes.input }}
                              />
                              <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                            </div>
                          )
                        }}
                      </accountForm.Field>
                      <accountForm.Field
                        name="lastName"
                        validators={{
                          onSubmit: ({ value }) => (value.trim() ? undefined : 'Last name is required'),
                        }}
                      >
                        {(field) => {
                          const message = formatFieldError(field.state.meta.errors)
                          return (
                            <div className={classes.field}>
                              <TextInput
                                label="Last name"
                                size="md"
                                radius="md"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.currentTarget.value)}
                                error={show && Boolean(message)}
                                classNames={{ label: classes.label, input: classes.input }}
                              />
                              <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                            </div>
                          )
                        }}
                      </accountForm.Field>
                    </div>

                    <accountForm.Field
                      name="email"
                      validators={{
                        onSubmit: ({ value }) => {
                          const result = accountStepBaseSchema.shape.email.safeParse(value)
                          return result.success ? undefined : result.error.issues[0]?.message
                        },
                      }}
                    >
                      {(field) => {
                        const message = formatFieldError(field.state.meta.errors)
                        return (
                          <div className={classes.field}>
                            <TextInput
                              label="Work email"
                              placeholder="you@company.com"
                              size="md"
                              radius="md"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              error={show && Boolean(message)}
                              autoComplete="email"
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                          </div>
                        )
                      }}
                    </accountForm.Field>

                    <accountForm.Field
                      name="password"
                      validators={{
                        onSubmit: ({ value }) => {
                          const result = accountStepBaseSchema.shape.password.safeParse(value)
                          return result.success ? undefined : result.error.issues[0]?.message
                        },
                      }}
                    >
                      {(field) => {
                        const message = formatFieldError(field.state.meta.errors)
                        return (
                          <div className={classes.field}>
                            <PasswordInput
                              label="Password"
                              size="md"
                              radius="md"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              error={show && Boolean(message)}
                              autoComplete="new-password"
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                          </div>
                        )
                      }}
                    </accountForm.Field>

                    <accountForm.Field
                      name="confirmPassword"
                      validators={{
                        onSubmit: ({ value, fieldApi }) => {
                          if (!value) return 'Confirm your password'
                          if (value !== fieldApi.form.state.values.password) return 'Passwords do not match'
                          return undefined
                        },
                      }}
                    >
                      {(field) => {
                        const message = formatFieldError(field.state.meta.errors)
                        return (
                          <div className={classes.field}>
                            <PasswordInput
                              label="Confirm password"
                              size="md"
                              radius="md"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              error={show && Boolean(message)}
                              autoComplete="new-password"
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                          </div>
                        )
                      }}
                    </accountForm.Field>

                    <accountForm.Field
                      name="acceptTerms"
                      validators={{
                        onSubmit: ({ value }) =>
                          value ? undefined : 'You must accept the Terms of Service and Privacy Policy',
                      }}
                    >
                      {(field) => {
                        const message = formatFieldError(field.state.meta.errors)
                        return (
                          <div className={classes.field}>
                            <Checkbox
                              checked={field.state.value}
                              onChange={(e) => field.handleChange(e.currentTarget.checked)}
                              label="I accept the Terms of Service and Privacy Policy"
                              error={show && Boolean(message)}
                            />
                            <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                          </div>
                        )
                      }}
                    </accountForm.Field>
                  </>
                )
              }}
            </accountForm.Subscribe>
          </div>

          <div className={classes.actions}>
            <Button type="submit" size="md" radius="md" className={classes.submit}>
              Continue
            </Button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void organizationForm.handleSubmit()
          }}
        >
          <div className={classes.fields}>
            <organizationForm.Subscribe selector={(s) => s.submissionAttempts}>
              {(attempts) => {
                const show = attempts > 0
                return (
                  <>
                    <organizationForm.Field
                      name="name"
                      validators={{
                        onSubmit: ({ value }) =>
                          value.trim().length >= 2 ? undefined : 'Organization name is required',
                      }}
                    >
                      {(field) => {
                        const message = formatFieldError(field.state.meta.errors)
                        return (
                          <div className={classes.field}>
                            <TextInput
                              label="Organization name"
                              size="md"
                              radius="md"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              error={show && Boolean(message)}
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                          </div>
                        )
                      }}
                    </organizationForm.Field>

                    <organizationForm.Field
                      name="companyEmail"
                      validators={{
                        onSubmit: ({ value }) => {
                          const result = organizationStepSchema.shape.companyEmail.safeParse(value)
                          return result.success ? undefined : result.error.issues[0]?.message
                        },
                      }}
                    >
                      {(field) => {
                        const message = formatFieldError(field.state.meta.errors)
                        return (
                          <div className={classes.field}>
                            <TextInput
                              label="Company email"
                              size="md"
                              radius="md"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              error={show && Boolean(message)}
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                          </div>
                        )
                      }}
                    </organizationForm.Field>

                    <div className={classes.grid2}>
                      <organizationForm.Field
                        name="industry"
                        validators={{
                          onSubmit: ({ value }) => (value ? undefined : 'Select an industry'),
                        }}
                      >
                        {(field) => {
                          const message = formatFieldError(field.state.meta.errors)
                          return (
                            <div className={classes.field}>
                              <Select
                                label="Industry"
                                data={INDUSTRIES}
                                size="md"
                                radius="md"
                                value={field.state.value || null}
                                onChange={(v) => field.handleChange(v ?? '')}
                                error={show && Boolean(message)}
                                classNames={{ label: classes.label, input: classes.input }}
                              />
                              <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                            </div>
                          )
                        }}
                      </organizationForm.Field>
                      <organizationForm.Field
                        name="companySize"
                        validators={{
                          onSubmit: ({ value }) => (value ? undefined : 'Select company size'),
                        }}
                      >
                        {(field) => {
                          const message = formatFieldError(field.state.meta.errors)
                          return (
                            <div className={classes.field}>
                              <Select
                                label="Company size"
                                data={COMPANY_SIZES}
                                size="md"
                                radius="md"
                                value={field.state.value || null}
                                onChange={(v) => field.handleChange(v ?? '')}
                                error={show && Boolean(message)}
                                classNames={{ label: classes.label, input: classes.input }}
                              />
                              <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                            </div>
                          )
                        }}
                      </organizationForm.Field>
                    </div>

                    <div className={classes.grid2}>
                      <organizationForm.Field
                        name="country"
                        validators={{
                          onSubmit: ({ value }) => (value ? undefined : 'Select a country'),
                        }}
                      >
                        {(field) => {
                          const message = formatFieldError(field.state.meta.errors)
                          return (
                            <div className={classes.field}>
                              <Select
                                label="Country"
                                data={COUNTRIES}
                                searchable
                                size="md"
                                radius="md"
                                value={field.state.value || null}
                                onChange={(v) => field.handleChange(v ?? '')}
                                error={show && Boolean(message)}
                                classNames={{ label: classes.label, input: classes.input }}
                              />
                              <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                            </div>
                          )
                        }}
                      </organizationForm.Field>
                      <organizationForm.Field
                        name="timezone"
                        validators={{
                          onSubmit: ({ value }) => (value ? undefined : 'Select a time zone'),
                        }}
                      >
                        {(field) => {
                          const message = formatFieldError(field.state.meta.errors)
                          return (
                            <div className={classes.field}>
                              <Select
                                label="Time zone"
                                data={TIMEZONES}
                                searchable
                                size="md"
                                radius="md"
                                value={field.state.value || null}
                                onChange={(v) => field.handleChange(v ?? '')}
                                error={show && Boolean(message)}
                                classNames={{ label: classes.label, input: classes.input }}
                              />
                              <div className={classes.errorSpace}>{show && message ? message : '\u00a0'}</div>
                            </div>
                          )
                        }}
                      </organizationForm.Field>
                    </div>

                    <div className={classes.grid2}>
                      <organizationForm.Field name="website">
                        {(field) => (
                          <div className={classes.field}>
                            <TextInput
                              label="Website (optional)"
                              size="md"
                              radius="md"
                              value={field.state.value ?? ''}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{'\u00a0'}</div>
                          </div>
                        )}
                      </organizationForm.Field>
                      <organizationForm.Field name="phone">
                        {(field) => (
                          <div className={classes.field}>
                            <TextInput
                              label="Phone (optional)"
                              size="md"
                              radius="md"
                              value={field.state.value ?? ''}
                              onChange={(e) => field.handleChange(e.currentTarget.value)}
                              classNames={{ label: classes.label, input: classes.input }}
                            />
                            <div className={classes.errorSpace}>{'\u00a0'}</div>
                          </div>
                        )}
                      </organizationForm.Field>
                    </div>
                  </>
                )
              }}
            </organizationForm.Subscribe>
          </div>

          <div className={classes.actions}>
            <Button
              type="button"
              variant="default"
              size="md"
              radius="md"
              className={classes.back}
              onClick={() => setStep(0)}
            >
              Back
            </Button>
            <Button type="submit" size="md" radius="md" className={classes.submit}>
              Continue
            </Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void setupForm.handleSubmit()
          }}
        >
          <div className={classes.fields}>
            <setupForm.Field name="departments">
              {(field) => (
                <div className={classes.field}>
                  <TextInput
                    label="Departments (optional)"
                    description="Comma-separated, e.g. People, Engineering"
                    size="md"
                    radius="md"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    classNames={{ label: classes.label, input: classes.input }}
                  />
                  <div className={classes.errorSpace}>{'\u00a0'}</div>
                </div>
              )}
            </setupForm.Field>
            <setupForm.Field name="locations">
              {(field) => (
                <div className={classes.field}>
                  <TextInput
                    label="Locations (optional)"
                    description="Comma-separated, e.g. HQ, Remote"
                    size="md"
                    radius="md"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.currentTarget.value)}
                    classNames={{ label: classes.label, input: classes.input }}
                  />
                  <div className={classes.errorSpace}>{'\u00a0'}</div>
                </div>
              )}
            </setupForm.Field>
            <setupForm.Field
              name="workingDays"
              validators={{
                onSubmit: ({ value }) => (value.length ? undefined : 'Select at least one working day'),
              }}
            >
              {(field) => (
                <div className={classes.field}>
                  <MultiSelect
                    label="Working days"
                    data={WEEKDAYS}
                    size="md"
                    radius="md"
                    value={field.state.value}
                    onChange={field.handleChange}
                    classNames={{ label: classes.label, input: classes.input }}
                  />
                  <div className={classes.errorSpace}>{'\u00a0'}</div>
                </div>
              )}
            </setupForm.Field>
            <div className={classes.grid2}>
              <setupForm.Field name="workStartTime">
                {(field) => (
                  <div className={classes.field}>
                    <TextInput
                      type="time"
                      label="Work start"
                      size="md"
                      radius="md"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.currentTarget.value)}
                      classNames={{ label: classes.label, input: classes.input }}
                    />
                    <div className={classes.errorSpace}>{'\u00a0'}</div>
                  </div>
                )}
              </setupForm.Field>
              <setupForm.Field name="workEndTime">
                {(field) => (
                  <div className={classes.field}>
                    <TextInput
                      type="time"
                      label="Work end"
                      size="md"
                      radius="md"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.currentTarget.value)}
                      classNames={{ label: classes.label, input: classes.input }}
                    />
                    <div className={classes.errorSpace}>{'\u00a0'}</div>
                  </div>
                )}
              </setupForm.Field>
            </div>
          </div>

          <div className={classes.actions}>
            <Button
              type="button"
              variant="default"
              size="md"
              radius="md"
              className={classes.back}
              onClick={() => setStep(1)}
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="light"
              size="md"
              radius="md"
              className={classes.submit}
              disabled={mutation.isPending}
              onClick={() => {
                setupForm.setFieldValue('departments', '')
                setupForm.setFieldValue('locations', '')
                void setupForm.handleSubmit()
              }}
            >
              Skip & finish
            </Button>
            <Button
              type="submit"
              size="md"
              radius="md"
              className={classes.submit}
              loading={mutation.isPending}
              disabled={mutation.isPending}
            >
              Create workspace
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 && result ? (
        <div className={classes.successCard}>
          <h2 className={classes.successTitle}>{result.organizationName} is ready</h2>
          <p className={classes.successBody}>
            We created your organization and assigned you as <strong>ORG_ADMIN</strong>. Verify{' '}
            <strong>{result.email}</strong> to activate your account, then sign in.
          </p>
          {result.developmentVerificationToken ? (
            <div className={classes.devToken}>
              Dev verification token: {result.developmentVerificationToken}
              <div style={{ marginTop: '0.55rem' }}>
                <Anchor component={Link} to={`/verify-email?token=${result.developmentVerificationToken}`}>
                  Verify now
                </Anchor>
              </div>
            </div>
          ) : null}
          <div className={classes.actions}>
            <Button component={Link} to="/login" size="md" radius="md" className={classes.submit}>
              Go to sign in
            </Button>
          </div>
        </div>
      ) : null}

      {step < 3 ? (
        <div className={classes.footer}>
          Already have an account?{' '}
          <Anchor component={Link} to="/login" className={classes.footerLink}>
            Sign in
          </Anchor>
        </div>
      ) : null}
    </div>
  )
}
