import { Button, Group, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { EMPLOYEE_STATUSES, type EmployeeDetail } from '../../types/employee'
import { useDepartmentsQuery, useLocationsQuery, usePositionsQuery, useTeamsQuery } from '../organization/hooks'
import { employeeFormSchema, type EmployeeFormValues } from './schemas'

interface EmployeeFormProps {
  initialValues?: Partial<EmployeeFormValues>
  employee?: EmployeeDetail
  submitLabel: string
  onSubmit: (values: EmployeeFormValues) => Promise<void>
  onCancel: () => void
}

function toFormValues(employee?: EmployeeDetail, initial?: Partial<EmployeeFormValues>): EmployeeFormValues {
  return {
    employeeNumber: employee?.employeeNumber ?? initial?.employeeNumber ?? '',
    firstName: employee?.firstName ?? initial?.firstName ?? '',
    lastName: employee?.lastName ?? initial?.lastName ?? '',
    workEmail: employee?.workEmail ?? initial?.workEmail ?? '',
    personalEmail: employee?.personalEmail ?? initial?.personalEmail ?? '',
    phone: employee?.phone ?? initial?.phone ?? '',
    status: employee?.status ?? initial?.status ?? 'ACTIVE',
    hireDate: employee?.hireDate ?? initial?.hireDate ?? '',
    dateOfBirth: employee?.dateOfBirth ?? initial?.dateOfBirth ?? '',
    departmentId: employee?.departmentId ?? initial?.departmentId ?? '',
    positionId: employee?.positionId ?? initial?.positionId ?? '',
    teamId: employee?.teamId ?? initial?.teamId ?? '',
    managerId: employee?.managerId ?? initial?.managerId ?? '',
    locationId: employee?.locationId ?? initial?.locationId ?? '',
    jobTitle: employee?.jobTitle ?? initial?.jobTitle ?? '',
  }
}

function fieldError(errors: unknown[]): string | undefined {
  const first = errors[0]
  if (!first) return undefined
  if (typeof first === 'string') return first
  if (typeof first === 'object' && first && 'message' in first) {
    return String((first as { message: unknown }).message)
  }
  return String(first)
}

export function EmployeeForm({
  initialValues,
  employee,
  submitLabel,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const departments = useDepartmentsQuery()
  const positions = usePositionsQuery()
  const teams = useTeamsQuery()
  const locations = useLocationsQuery()

  const form = useForm({
    defaultValues: toFormValues(employee, initialValues),
    validators: {
      onSubmit: employeeFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const departmentOptions =
    departments.data?.data.map((d) => ({ value: d.id, label: d.name })) ?? []
  const positionOptions =
    positions.data?.data.map((p) => ({ value: p.id, label: p.title })) ?? []
  const teamOptions = teams.data?.data.map((t) => ({ value: t.id, label: t.name })) ?? []
  const locationOptions =
    locations.data?.data.map((l) => ({ value: l.id, label: l.name })) ?? []

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <form.Field name="employeeNumber">
            {(field) => (
              <TextInput
                label="Employee number"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="status">
            {(field) => (
              <Select
                label="Status"
                data={[...EMPLOYEE_STATUSES]}
                value={field.state.value}
                onChange={(value) => field.handleChange((value as EmployeeFormValues['status']) ?? 'ACTIVE')}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="firstName">
            {(field) => (
              <TextInput
                label="First name"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="lastName">
            {(field) => (
              <TextInput
                label="Last name"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="workEmail">
            {(field) => (
              <TextInput
                label="Work email"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="personalEmail">
            {(field) => (
              <TextInput
                label="Personal email"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="phone">
            {(field) => (
              <TextInput
                label="Phone"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
              />
            )}
          </form.Field>
          <form.Field name="jobTitle">
            {(field) => (
              <TextInput
                label="Job title"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
              />
            )}
          </form.Field>
          <form.Field name="hireDate">
            {(field) => (
              <TextInput
                type="date"
                label="Hire date"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
              />
            )}
          </form.Field>
          <form.Field name="dateOfBirth">
            {(field) => (
              <TextInput
                type="date"
                label="Date of birth"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
              />
            )}
          </form.Field>
          <form.Field name="departmentId">
            {(field) => (
              <Select
                label="Department"
                clearable
                data={departmentOptions}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? '')}
              />
            )}
          </form.Field>
          <form.Field name="positionId">
            {(field) => (
              <Select
                label="Position"
                clearable
                data={positionOptions}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? '')}
              />
            )}
          </form.Field>
          <form.Field name="teamId">
            {(field) => (
              <Select
                label="Team"
                clearable
                data={teamOptions}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? '')}
              />
            )}
          </form.Field>
          <form.Field name="locationId">
            {(field) => (
              <Select
                label="Location"
                clearable
                data={locationOptions}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? '')}
              />
            )}
          </form.Field>
        </SimpleGrid>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" loading={isSubmitting}>
                {submitLabel}
              </Button>
            )}
          </form.Subscribe>
        </Group>
      </Stack>
    </form>
  )
}
