import { Button, Group, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { useForm, useStore } from '@tanstack/react-form'
import { useEffect } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { EMPLOYEE_STATUSES, type EmployeeDetail } from '../../types/employee'
import { useDepartmentsQuery, useLocationsQuery, usePositionsQuery, useTeamsQuery } from '../organization/hooks'
import { activeDepartmentOptions, activePositionOptions, resolveDepartmentSelection } from '../organization/structure'
import { fieldError } from '../../utils/fieldError'
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

export function EmployeeForm({
  initialValues,
  employee,
  submitLabel,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const organizationId = useAuth().user?.organizationId ?? null
  const departments = useDepartmentsQuery({ activeOnly: true })
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

  const departmentId = useStore(form.store, (state) => state.values.departmentId) ?? ''
  const positionId = useStore(form.store, (state) => state.values.positionId) ?? ''
  const departmentOptions = departments.isSuccess
    ? activeDepartmentOptions(departments.data?.data ?? [], organizationId)
    : null
  const positions = usePositionsQuery({
    activeOnly: true,
    departmentId: departmentId || undefined,
  })
  const positionOptions = positions.isSuccess
    ? activePositionOptions(positions.data?.data ?? [], organizationId, departmentId || null)
    : null

  useEffect(() => {
    const keepDepartment = Boolean(employee?.departmentId) && employee?.departmentId === departmentId
    const nextDepartment = keepDepartment
      ? departmentId
      : resolveDepartmentSelection(departmentId, departmentOptions)
    if (nextDepartment !== departmentId) {
      form.setFieldValue('departmentId', nextDepartment)
    }
    const keepPosition =
      Boolean(employee?.positionId) &&
      employee?.positionId === positionId &&
      (employee?.departmentId ?? '') === departmentId
    const nextPosition = keepPosition
      ? positionId
      : resolveDepartmentSelection(positionId, positionOptions)
    if (nextPosition !== positionId) {
      form.setFieldValue('positionId', nextPosition)
    }
  }, [departmentId, departmentOptions, employee, positionId, positionOptions, form])

  const departmentSelectOptions = [...(departmentOptions ?? [])]
  if (
    employee?.departmentId &&
    employee.departmentId === departmentId &&
    !departmentSelectOptions.some((option) => option.value === employee.departmentId)
  ) {
    departmentSelectOptions.unshift({
      value: employee.departmentId,
      label: employee.departmentName ?? 'Current department',
    })
  }
  const positionSelectOptions = [...(positionOptions ?? [])]
  if (
    employee?.positionId &&
    employee.positionId === positionId &&
    !positionSelectOptions.some((option) => option.value === employee.positionId)
  ) {
    positionSelectOptions.unshift({
      value: employee.positionId,
      label: employee.positionTitle ?? 'Current position',
    })
  }
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
                data={departmentSelectOptions}
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
                data={positionSelectOptions}
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
