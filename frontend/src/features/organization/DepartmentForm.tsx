import { Button, Group, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { useMemo } from 'react'
import { useEmployeesQuery } from '../employees/hooks'
import { fieldError } from '../../utils/fieldError'
import { departmentFormSchema, type DepartmentFormValues } from './schemas'
import { orgUnitStatusOptions } from './structure'
import type { Department } from '../../types/organization'

interface DepartmentFormProps {
  department?: Department | null
  submitLabel: string
  onSubmit: (values: DepartmentFormValues) => Promise<void>
  onCancel: () => void
}

function toValues(department?: Department | null): DepartmentFormValues {
  return {
    name: department?.name ?? '',
    code: department?.code ?? '',
    description: department?.description ?? '',
    managerEmployeeId: department?.managerEmployeeId ?? '',
    status: department?.status ?? 'ACTIVE',
  }
}

export function DepartmentForm({ department, submitLabel, onSubmit, onCancel }: DepartmentFormProps) {
  const employees = useEmployeesQuery({ page: 0, size: 100, status: 'ACTIVE' })
  const managerOptions = useMemo(
    () =>
      (employees.data?.data ?? []).map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })),
    [employees.data],
  )

  const form = useForm({
    defaultValues: toValues(department),
    validators: {
      onSubmit: departmentFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <Stack gap="md">
        <form.Field name="name">
          {(field) => (
            <TextInput
              label="Department name"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="code">
          {(field) => (
            <TextInput
              label="Department code"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <Textarea
              label="Description"
              minRows={3}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="managerEmployeeId">
          {(field) => (
            <Select
              label="Department head"
              placeholder="Optional"
              clearable
              searchable
              data={managerOptions}
              value={field.state.value || null}
              onChange={(value) => field.handleChange(value ?? '')}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="status">
          {(field) => (
            <Select
              label="Status"
              data={orgUnitStatusOptions}
              value={field.state.value}
              onChange={(value) => field.handleChange(value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <Group justify="flex-end">
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
