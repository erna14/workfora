import { Button, Group, Select, Stack, Text } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { useMemo } from 'react'
import { useEmployeesQuery } from '../employees/hooks'
import { departmentBulkSchema, type DepartmentBulkValues } from './schemas'

interface DepartmentBulkFormProps {
  count: number
  onSubmit: (values: DepartmentBulkValues) => Promise<void>
  onCancel: () => void
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

export function DepartmentBulkForm({ count, onSubmit, onCancel }: DepartmentBulkFormProps) {
  const employees = useEmployeesQuery({ page: 0, size: 100, status: 'ACTIVE' })
  const managerOptions = useMemo(
    () => [
      { value: '__keep__', label: 'No change' },
      { value: '__clear__', label: 'Remove department head' },
      ...(employees.data?.data ?? []).map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })),
    ],
    [employees.data],
  )

  const form = useForm({
    defaultValues: {
      status: '__keep__' as DepartmentBulkValues['status'],
      manager: '__keep__',
    },
    validators: {
      onSubmit: departmentBulkSchema,
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
        <Text size="sm" c="dimmed">
          Changes apply to {count} selected {count === 1 ? 'department' : 'departments'}. Name and code stay as they
          are.
        </Text>
        <form.Field name="status">
          {(field) => (
            <Select
              label="Status"
              data={[
                { value: '__keep__', label: 'No change' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              value={field.state.value}
              onChange={(value) => field.handleChange(value === 'INACTIVE' || value === 'ACTIVE' ? value : '__keep__')}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="manager">
          {(field) => (
            <Select
              label="Department head"
              searchable
              data={managerOptions}
              value={field.state.value}
              onChange={(value) => field.handleChange(value ?? '__keep__')}
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
                Apply changes
              </Button>
            )}
          </form.Subscribe>
        </Group>
      </Stack>
    </form>
  )
}
