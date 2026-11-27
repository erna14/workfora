import { Button, Group, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { fieldError } from '../../utils/fieldError'
import { assetFormSchema, type AssetFormValues } from './schemas'
import type { AssetCategory } from './types'

interface AssetFormProps {
  categories: AssetCategory[]
  initial?: AssetFormValues
  submitLabel: string
  onSubmit: (values: AssetFormValues) => Promise<void>
  onCancel: () => void
}

const emptyAsset: AssetFormValues = {
  name: '',
  assetTag: '',
  categoryId: '',
  serialNumber: '',
  purchaseDate: '',
  purchaseCost: '',
  notes: '',
}

export function AssetForm({ categories, initial, submitLabel, onSubmit, onCancel }: AssetFormProps) {
  const form = useForm({
    defaultValues: initial ?? emptyAsset,
    validators: { onSubmit: assetFormSchema },
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
        <form.Field name="name">
          {(field) => (
            <TextInput
              label="Asset name"
              withAsterisk
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="assetTag">
          {(field) => (
            <TextInput
              label="Asset tag"
              withAsterisk
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="categoryId">
          {(field) => (
            <Select
              label="Category"
              placeholder="No category"
              clearable
              searchable
              data={categories.map((category) => ({ value: category.id, label: category.name }))}
              value={field.state.value || null}
              onChange={(value) => field.handleChange(value ?? '')}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="serialNumber">
          {(field) => (
            <TextInput
              label="Serial number"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="purchaseDate">
          {(field) => (
            <TextInput
              type="date"
              label="Purchase date"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="purchaseCost">
          {(field) => (
            <TextInput
              label="Purchase cost"
              inputMode="decimal"
              placeholder="0.00"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="notes">
          {(field) => (
            <Textarea
              label="Notes"
              minRows={3}
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
