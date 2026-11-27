import { ActionIcon, Button, Group, Stack, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { fieldError } from '../../utils/fieldError'
import { categoryFormSchema, type CategoryFormValues } from './schemas'
import type { AssetCategory } from './types'

interface CategoryManagerProps {
  categories: AssetCategory[]
  canWrite: boolean
  onSave: (values: CategoryFormValues, categoryId: string | null) => Promise<void>
  onDelete: (category: AssetCategory) => Promise<void>
  onClose: () => void
}

export function CategoryManager({ categories, canWrite, onSave, onDelete, onClose }: CategoryManagerProps) {
  const [editing, setEditing] = useState<AssetCategory | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AssetCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const form = useForm({
    defaultValues: { name: '', description: '' } satisfies CategoryFormValues,
    validators: { onSubmit: categoryFormSchema },
    onSubmit: async ({ value }) => {
      await onSave(value, editing?.id ?? null)
      setEditing(null)
      form.reset()
    },
  })

  function startEdit(category: AssetCategory) {
    setPendingDelete(null)
    setEditing(category)
    form.setFieldValue('name', category.name)
    form.setFieldValue('description', category.description ?? '')
  }

  function cancelEdit() {
    setEditing(null)
    form.reset()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const target = pendingDelete
    setDeleting(true)
    try {
      await onDelete(target)
      setPendingDelete(null)
      if (editing?.id === target.id) cancelEdit()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Stack gap="md">
      {canWrite ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              {editing ? 'Edit category' : 'New category'}
            </Text>
            <form.Field name="name">
              {(field) => (
                <TextInput
                  label="Category name"
                  withAsterisk
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
                  minRows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.value)}
                  error={fieldError(field.state.meta.errors)}
                />
              )}
            </form.Field>
            <Group justify="flex-end">
              {editing ? (
                <Button variant="default" onClick={cancelEdit}>
                  Cancel
                </Button>
              ) : null}
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" loading={isSubmitting}>
                    {editing ? 'Save changes' : 'Add category'}
                  </Button>
                )}
              </form.Subscribe>
            </Group>
          </Stack>
        </form>
      ) : null}
      {pendingDelete ? (
        <Stack gap="xs">
          <Text size="sm">
            Delete {pendingDelete.name}? The category stays if an asset still uses it.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" disabled={deleting} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button color="red" loading={deleting} onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </Group>
        </Stack>
      ) : null}
      <Stack gap="xs">
        {categories.length === 0 ? (
          <Text size="sm" c="dimmed">
            No categories yet.
          </Text>
        ) : (
          categories.map((category) => (
            <Group key={category.id} justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text size="sm" fw={600}>
                  {category.name}
                </Text>
                {category.description ? (
                  <Text size="xs" c="dimmed">
                    {category.description}
                  </Text>
                ) : null}
              </Stack>
              {canWrite ? (
                <Group gap={4} wrap="nowrap">
                  <Tooltip label="Edit">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => startEdit(category)}
                    >
                      <Pencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setPendingDelete(category)}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ) : null}
            </Group>
          ))
        )}
      </Stack>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </Group>
    </Stack>
  )
}
