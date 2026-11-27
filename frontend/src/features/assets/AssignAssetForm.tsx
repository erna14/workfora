import { Button, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { useMemo, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { fieldError } from '../../utils/fieldError'
import { fullName } from '../../utils/format'
import { useEmployeesQuery } from '../employees/hooks'
import { assignAssetSchema, type AssignAssetValues } from './schemas'

interface AssignAssetFormProps {
  assetName: string
  submitLabel?: string
  onSubmit: (values: AssignAssetValues) => Promise<void>
  onCancel: () => void
}

export function AssignAssetForm({ assetName, submitLabel = 'Assign asset', onSubmit, onCancel }: AssignAssetFormProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const employees = useEmployeesQuery({
    page: 0,
    size: 20,
    status: 'ACTIVE',
    search: debouncedSearch || undefined,
  })
  const options = useMemo(
    () =>
      (employees.data?.data ?? []).map((employee) => ({
        value: employee.id,
        label: [fullName(employee.firstName, employee.lastName), employee.employeeNumber, employee.departmentName]
          .filter(Boolean)
          .join(' · '),
      })),
    [employees.data],
  )
  const total = employees.data?.meta.totalElements ?? 0
  const form = useForm({
    defaultValues: { employeeId: '', notes: '' } satisfies AssignAssetValues,
    validators: { onSubmit: assignAssetSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <Stack gap="sm">
        <Text size="sm">Choose the employee who will hold {assetName}.</Text>
        <TextInput
          label="Find employee"
          placeholder="Name, number, or email"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <form.Field name="employeeId">
          {(field) => (
            <Select
              label="Employee"
              withAsterisk
              searchable
              placeholder={employees.isLoading ? 'Loading employees…' : 'Select an employee'}
              data={options}
              value={field.state.value || null}
              onChange={(value) => field.handleChange(value ?? '')}
              error={fieldError(field.state.meta.errors)}
              nothingFoundMessage="No active employees match"
            />
          )}
        </form.Field>
        {total > options.length ? (
          <Text size="xs" c="dimmed">
            Showing {options.length} of {total} active employees. Search to narrow the list.
          </Text>
        ) : null}
        <form.Field name="notes">
          {(field) => (
            <Textarea
              label="Notes"
              minRows={2}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
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
              <Button type="submit" loading={isSubmitting} disabled={employees.isLoading}>
                {submitLabel}
              </Button>
            )}
          </form.Subscribe>
        </Group>
      </Stack>
    </form>
  )
}
