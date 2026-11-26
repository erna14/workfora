import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { FilterX, RefreshCw } from 'lucide-react'

interface TableFilterActionsProps {
  dirty: boolean
  refreshing?: boolean
  onClear: () => void
  onRefresh: () => void
}

export function TableFilterActions({ dirty, refreshing = false, onClear, onRefresh }: TableFilterActionsProps) {
  return (
    <Group gap={4} wrap="nowrap">
      <Tooltip label="Refresh">
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Refresh"
          loading={refreshing}
          onClick={onRefresh}
        >
          <RefreshCw size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={dirty ? 'Clear filters' : 'No filters to clear'}>
        <span style={{ display: 'inline-flex' }}>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Clear filters"
            disabled={!dirty}
            onClick={onClear}
          >
            <FilterX size={16} />
          </ActionIcon>
        </span>
      </Tooltip>
    </Group>
  )
}
