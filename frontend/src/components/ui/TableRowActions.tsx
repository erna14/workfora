import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { CircleOff, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react'

interface TableRowActionsProps {
  onView?: () => void
  onEdit?: () => void
  onToggleActive?: () => void
  active?: boolean
  onDelete?: () => void
}

export function TableRowActions({
  onView,
  onEdit,
  onToggleActive,
  active = true,
  onDelete,
}: TableRowActionsProps) {
  const toggleLabel = active ? 'Deactivate' : 'Reactivate'

  return (
    <Group gap={4} justify="flex-end" wrap="nowrap" onClick={(event) => event.stopPropagation()}>
      {onView ? (
        <Tooltip label="View">
          <ActionIcon variant="subtle" color="gray" aria-label="View" onClick={onView}>
            <Eye size={16} />
          </ActionIcon>
        </Tooltip>
      ) : null}
      {onEdit ? (
        <Tooltip label="Edit">
          <ActionIcon variant="subtle" color="gray" aria-label="Edit" onClick={onEdit}>
            <Pencil size={16} />
          </ActionIcon>
        </Tooltip>
      ) : null}
      {onToggleActive ? (
        <Tooltip label={toggleLabel}>
          <ActionIcon variant="subtle" color="gray" aria-label={toggleLabel} onClick={onToggleActive}>
            {active ? <CircleOff size={16} /> : <RotateCcw size={16} />}
          </ActionIcon>
        </Tooltip>
      ) : null}
      {onDelete ? (
        <Tooltip label="Delete">
          <ActionIcon variant="subtle" color="red" aria-label="Delete" onClick={onDelete}>
            <Trash2 size={16} />
          </ActionIcon>
        </Tooltip>
      ) : null}
    </Group>
  )
}
