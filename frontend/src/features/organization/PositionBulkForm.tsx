import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'
import { useForm, useStore } from '@tanstack/react-form'
import { useMemo } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { useDepartmentsQuery } from './hooks'
import { positionBulkSchema, type PositionBulkValues } from './schemas'
import { activeDepartmentOptions } from './structure'

interface PositionBulkFormProps {
  count: number
  onSubmit: (values: PositionBulkValues) => Promise<void>
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

export function PositionBulkForm({ count, onSubmit, onCancel }: PositionBulkFormProps) {
  const organizationId = useAuth().user?.organizationId ?? null
  const departments = useDepartmentsQuery({ activeOnly: true })
  const departmentOptions = useMemo(
    () => [
      { value: '__keep__', label: 'No change' },
      ...activeDepartmentOptions(departments.data?.data ?? [], organizationId),
    ],
    [departments.data, organizationId],
  )

  const form = useForm({
    defaultValues: {
      status: '__keep__' as PositionBulkValues['status'],
      departmentId: '__keep__',
      levelMode: '__keep__' as PositionBulkValues['levelMode'],
      level: '',
    },
    validators: {
      onSubmit: positionBulkSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })
  const levelMode = useStore(form.store, (state) => state.values.levelMode)

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
          Changes apply to {count} selected {count === 1 ? 'position' : 'positions'}. Each title stays as it is.
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
        <form.Field name="departmentId">
          {(field) => (
            <Select
              label="Department"
              searchable
              data={departmentOptions}
              value={field.state.value}
              onChange={(value) => field.handleChange(value ?? '__keep__')}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="levelMode">
          {(field) => (
            <Select
              label="Level"
              data={[
                { value: '__keep__', label: 'No change' },
                { value: 'set', label: 'Set level' },
                { value: 'clear', label: 'Clear level' },
              ]}
              value={field.state.value}
              onChange={(value) =>
                field.handleChange(value === 'set' || value === 'clear' ? value : '__keep__')
              }
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        {levelMode === 'set' ? (
          <form.Field name="level">
            {(field) => (
              <TextInput
                label="New level"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
        ) : null}
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
