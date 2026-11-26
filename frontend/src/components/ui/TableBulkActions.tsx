import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { Pencil, Trash2 } from 'lucide-react'

interface TableBulkActionsProps {
  count: number
  singular: string
  plural: string
  onEdit?: () => void
  onDelete?: () => void
}

export function TableBulkActions({ count, singular, plural, onEdit, onDelete }: TableBulkActionsProps) {
  const noun = count === 1 ? singular : plural
  const editLabel = count === 0 ? 'Select rows to edit' : `Edit ${count} ${noun}`
  const deleteLabel = count === 0 ? 'Select rows to delete' : `Delete ${count} ${noun}`

  const idle = count === 0

  return (
    <Group gap={4} wrap="nowrap">
      {onEdit ? (
        <Tooltip label={editLabel}>
          <span style={{ display: 'inline-flex' }}>
            <ActionIcon
              variant="light"
              color="blue"
              size="lg"
              aria-label={editLabel}
              disabled={idle}
              onClick={onEdit}
              style={{
                color: 'var(--mantine-color-blue-light-color)',
                background: 'var(--mantine-color-blue-light)',
                opacity: idle ? 0.72 : 1,
              }}
            >
              <Pencil size={16} />
            </ActionIcon>
          </span>
        </Tooltip>
      ) : null}
      {onDelete ? (
        <Tooltip label={deleteLabel}>
          <span style={{ display: 'inline-flex' }}>
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              aria-label={deleteLabel}
              disabled={idle}
              onClick={onDelete}
              style={{
                color: 'var(--mantine-color-red-light-color)',
                background: 'var(--mantine-color-red-light)',
                opacity: idle ? 0.72 : 1,
              }}
            >
              <Trash2 size={16} />
            </ActionIcon>
          </span>
        </Tooltip>
      ) : null}
    </Group>
  )
}
