import { Button, Group, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm, useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Position } from '../../types/organization'
import { useDepartmentsQuery } from './hooks'
import { positionFormSchema, type PositionFormValues } from './schemas'
import { activeDepartmentOptions, resolveDepartmentSelection } from './structure'

interface PositionFormProps {
  position?: Position | null
  submitLabel: string
  onSubmit: (values: PositionFormValues) => Promise<void>
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

function toValues(position?: Position | null): PositionFormValues {
  return {
    title: position?.title ?? '',
    departmentId: position?.departmentId ?? '',
    level: position?.level ?? '',
    description: position?.description ?? '',
    status: position?.status ?? 'ACTIVE',
  }
}

export function PositionForm({ position, submitLabel, onSubmit, onCancel }: PositionFormProps) {
  const organizationId = useAuth().user?.organizationId ?? null
  const departments = useDepartmentsQuery({ activeOnly: true })
  const options = departments.isSuccess
    ? activeDepartmentOptions(departments.data?.data ?? [], organizationId)
    : null

  const form = useForm({
    defaultValues: toValues(position),
    validators: {
      onSubmit: positionFormSchema,
    },
    onSubmit: async ({ value }) => {
      const allowed = resolveDepartmentSelection(value.departmentId, options)
      if (!allowed) {
        return
      }
      await onSubmit({ ...value, departmentId: allowed })
    },
  })

  const departmentId = useStore(form.store, (state) => state.values.departmentId)
  const previousOrg = useRef(organizationId)

  useEffect(() => {
    if (previousOrg.current !== organizationId) {
      previousOrg.current = organizationId
      form.setFieldValue('departmentId', '')
      return
    }
    const keepCurrent = Boolean(position?.departmentId) && position?.departmentId === departmentId
    const next = keepCurrent ? departmentId : resolveDepartmentSelection(departmentId ?? '', options)
    if (next !== departmentId) {
      form.setFieldValue('departmentId', next)
    }
  }, [organizationId, options, departmentId, form, position])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <Stack gap="md">
        <form.Field name="title">
          {(field) => (
            <TextInput
              label="Position title"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="departmentId">
          {(field) => (
            <Select
              label="Department"
              required
              searchable
              placeholder={departments.isLoading ? 'Loading departments…' : 'Select a department'}
              data={
                position?.departmentId &&
                position.departmentId === departmentId &&
                !(options ?? []).some((option) => option.value === position.departmentId)
                  ? [
                      {
                        value: position.departmentId,
                        label: position.departmentName ?? 'Current department',
                      },
                      ...(options ?? []),
                    ]
                  : (options ?? [])
              }
              value={field.state.value || null}
              onChange={(value) => field.handleChange(value ?? '')}
              error={fieldError(field.state.meta.errors)}
              nothingFoundMessage="No active departments in this organization"
            />
          )}
        </form.Field>
        <form.Field name="level">
          {(field) => (
            <TextInput
              label="Level"
              description="Optional label such as IC3 or M2. Each organization can use its own scale."
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
        <form.Field name="status">
          {(field) => (
            <Select
              label="Status"
              data={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              value={field.state.value}
              onChange={(value) => field.handleChange(value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
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
