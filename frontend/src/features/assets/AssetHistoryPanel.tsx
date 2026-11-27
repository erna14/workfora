import { Button, Group, Text, Timeline } from '@mantine/core'
import { Archive, History, Pencil, Plus, Undo2, UserPlus } from 'lucide-react'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatDateTime } from '../../utils/format'
import { historyDetail, historyTitle } from './structure'
import type { Asset, AssetHistory } from './types'

interface AssetHistoryPanelProps {
  asset: Asset
  history?: AssetHistory
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function AssetHistoryPanel({ asset, history, isLoading, isError, onRetry }: AssetHistoryPanelProps) {
  const current = history?.currentAssignment ?? asset.currentAssignment
  return (
    <>
      <Text size="sm" fw={600}>
        Current assignment
      </Text>
      {current ? (
        <Text size="sm" mb="md">
          {current.fullName} · {current.employeeNumber}. Assigned {formatDateTime(current.assignedAt)}.
        </Text>
      ) : (
        <Text size="sm" c="dimmed" mb="md">
          {asset.status === 'ASSIGNED' ? 'Assignment details unavailable' : 'Not assigned'}
        </Text>
      )}
      {isLoading ? <Text size="sm">Loading history…</Text> : null}
      {isError ? (
        <Group>
          <Text size="sm">History could not be loaded.</Text>
          <Button variant="default" size="xs" onClick={onRetry}>
            Retry
          </Button>
        </Group>
      ) : null}
      {history && history.events.length === 0 ? <Text size="sm">No history yet.</Text> : null}
      {history && history.events.length > 0 ? (
        <Timeline active={history.events.length} bulletSize={28} lineWidth={2}>
          {history.events.map((event, index) => (
            <Timeline.Item key={`${event.type}-${event.occurredAt}-${index}`} bullet={icon(event.type)} title={historyTitle(event)}>
              <Text size="xs" c="dimmed">
                {formatDateTime(event.occurredAt)}
              </Text>
              <Text size="sm">{historyDetail(event)}</Text>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : null}
      {asset.archivedAt ? (
        <Group gap="xs" mt="md">
          <StatusBadge status="ARCHIVED" />
          <Text size="xs" c="dimmed">
            Archived {formatDateTime(asset.archivedAt)}
          </Text>
        </Group>
      ) : null}
    </>
  )
}

function icon(type: string) {
  if (type === 'CREATED') return <Plus size={14} />
  if (type === 'UPDATED') return <Pencil size={14} />
  if (type === 'ARCHIVED') return <Archive size={14} />
  if (type === 'ASSIGNED') return <UserPlus size={14} />
  if (type === 'RETURNED') return <Undo2 size={14} />
  return <History size={14} />
}
