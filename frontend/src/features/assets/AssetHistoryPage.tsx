import { Button, Select, Stack, Text, TextInput } from '@mantine/core'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../app/providers/AuthProvider'
import { createDataTableHelper, DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { TableFilterActions } from '../../components/ui/TableFilterActions'
import { TableToolbar } from '../../components/ui/TableToolbar'
import { formatDateTime } from '../../utils/format'
import { AssetHistoryPanel } from './AssetHistoryPanel'
import { useAssetHistoryFeedQuery, useAssetHistoryQuery } from './hooks'
import { historyDetail, historyTitle } from './structure'
import type { Asset, HistoryFeedItem } from './types'

const PAGE_SIZE = 20
const helper = createDataTableHelper<HistoryFeedItem>()

const eventTypes = [
  { value: 'CREATED', label: 'Created' },
  { value: 'UPDATED', label: 'Updated' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export default function AssetHistoryPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('asset:read') || hasPermission('asset:write')
  const [searchParams, setSearchParams] = useSearchParams()
  const assetId = searchParams.get('asset')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string | null>(null)

  const feed = useAssetHistoryFeedQuery(
    { page, size: PAGE_SIZE, search: search.trim() || undefined, type: type ?? undefined },
    canView && !assetId,
  )
  const history = useAssetHistoryQuery(canView ? assetId : null)
  const rows = feed.data?.data

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: 'when',
          header: 'When',
          cell: ({ row }) => formatDateTime(row.original.event.occurredAt),
        }),
        helper.display({
          id: 'asset',
          header: 'Asset',
          cell: ({ row }) => (
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                {row.original.assetName}
              </Text>
              <Text size="xs" c="dimmed">
                {row.original.assetTag}
              </Text>
            </Stack>
          ),
        }),
        helper.display({
          id: 'event',
          header: 'Event',
          cell: ({ row }) => historyTitle(row.original.event),
        }),
        helper.display({
          id: 'detail',
          header: 'Detail',
          cell: ({ row }) => historyDetail(row.original.event),
        }),
        helper.display({
          id: 'actor',
          header: 'By',
          cell: ({ row }) => row.original.event.actorName || '—',
        }),
      ]),
    [],
  )

  function openAsset(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('asset', id)
    setSearchParams(next)
  }

  function showAll() {
    const next = new URLSearchParams(searchParams)
    next.delete('asset')
    setSearchParams(next)
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Asset history" description="Assignment changes and edits for company equipment." />
        <Text size="sm" c="dimmed">
          You do not have permission to view asset history.
        </Text>
      </>
    )
  }

  if (assetId) {
    const record = history.data
    const asset: Asset | null = record
      ? {
          id: record.assetId,
          name: record.assetName,
          assetTag: record.assetTag,
          categoryId: null,
          serialNumber: null,
          status: record.status,
          purchaseDate: null,
          purchaseCost: null,
          notes: null,
          archivedAt: record.archivedAt,
          currentAssignment: record.currentAssignment,
        }
      : null
    return (
      <>
        <PageHeader
          title={record ? record.assetName : 'Asset history'}
          description={record ? `${record.assetTag} · full lifecycle` : 'Assignment changes and edits for company equipment.'}
          actions={
            <Button variant="default" onClick={showAll}>
              All history
            </Button>
          }
        />
        <QueryState
          isLoading={history.isLoading}
          isError={history.isError}
          error={history.error}
          onRetry={() => void history.refetch()}
          isEmpty={false}
        >
          {asset && record ? (
            <AssetHistoryPanel
              asset={asset}
              history={record}
              isLoading={false}
              isError={false}
              onRetry={() => void history.refetch()}
            />
          ) : null}
        </QueryState>
      </>
    )
  }

  const filtersActive = search !== '' || type !== null
  const totalElements = feed.data?.meta.totalElements ?? 0

  return (
    <>
      <PageHeader
        title="Asset history"
        description="Assignment changes and edits for company equipment."
        actions={
          <Button component={Link} to="/assets" variant="default">
            Assets
          </Button>
        }
      />
      <TableToolbar
        filtersActive={filtersActive}
        filters={
          <>
            <TextInput
              placeholder="Search asset name or tag"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value)
                setPage(0)
              }}
            />
            <Select
              placeholder="Event"
              clearable
              data={eventTypes}
              value={type}
              onChange={(value) => {
                setType(value)
                setPage(0)
              }}
            />
          </>
        }
        actions={
          <TableFilterActions
            dirty={filtersActive}
            refreshing={feed.isFetching}
            onRefresh={() => void feed.refetch()}
            onClear={() => {
              setSearch('')
              setType(null)
              setPage(0)
            }}
          />
        }
      />
      <Text size="xs" c="dimmed" mb="sm">
        Newest events first. Open a row for that asset’s full timeline.
      </Text>
      <QueryState
        isLoading={feed.isLoading}
        isError={feed.isError}
        error={feed.error}
        onRetry={() => void feed.refetch()}
        isEmpty={!feed.isLoading && !feed.isError && totalElements === 0}
        emptyTitle={filtersActive ? 'No matching history' : 'No asset history yet'}
        emptyDescription={
          filtersActive
            ? 'Clear the search or event filter.'
            : 'History appears here when assets are added, edited, assigned, returned, or archived.'
        }
      >
        <DataTable
          data={rows ?? []}
          columns={columns}
          page={feed.data?.meta.page ?? page}
          pageSize={PAGE_SIZE}
          totalPages={feed.data?.meta.totalPages ?? 0}
          totalElements={totalElements}
          onPageChange={setPage}
          getRowId={(row) => `${row.assetId}-${row.event.type}-${row.event.occurredAt}-${row.event.field ?? ''}`}
          onRowClick={(row) => openAsset(row.assetId)}
          emptyTitle="No history on this page"
          emptyDescription="Open another page."
        />
      </QueryState>
    </>
  )
}
