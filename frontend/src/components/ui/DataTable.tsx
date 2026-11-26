import { Checkbox, Group, Pagination, Paper, Select, Table, Text, UnstyledButton } from '@mantine/core'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnDef,
  type TableFeatures,
} from '@tanstack/react-table'
import { useMemo, useRef } from 'react'
import { toggleColumnSort } from '../../utils/sort'
import { EmptyState } from './EmptyState'

const features = tableFeatures({})

export type DataTableColumn<TData extends object> = ColumnDef<typeof features, TData>

interface DataTableProps<TData extends object> {
  data: TData[]
  columns: Array<DataTableColumn<TData>>
  page: number
  pageSize: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  emptyTitle?: string
  emptyDescription?: string
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  selection?: {
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
    getRowLabel?: (row: TData) => string
  }
  sorting?: {
    value: string
    columns: string[]
    onChange: (sort: string) => void
  }
}

export function createDataTableHelper<TData extends object>() {
  return createColumnHelper<typeof features, TData>()
}

export function DataTable<TData extends object>({
  data,
  columns,
  page,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting search or filters.',
  getRowId,
  onRowClick,
  selection,
  sorting,
}: DataTableProps<TData>) {
  const stableData = useMemo(() => data, [data])
  const anchor = useRef<number | null>(null)
  const shiftKey = useRef(false)
  const selectedSet = useMemo(() => new Set(selection?.selectedIds ?? []), [selection?.selectedIds])

  const table = useTable({
    features: features as TableFeatures,
    columns,
    data: stableData,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  })

  function idsWith(checked: boolean, from: number, to: number) {
    if (!selection || !getRowId) return
    const next = new Set(selection.selectedIds)
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    for (let index = start; index <= end; index += 1) {
      const row = stableData[index]
      if (!row) continue
      const id = getRowId(row)
      if (checked) next.add(id)
      else next.delete(id)
    }
    selection.onSelectedIdsChange([...next])
  }

  function togglePage(checked: boolean) {
    if (!getRowId) return
    idsWith(checked, 0, stableData.length - 1)
  }

  const pageIds = getRowId ? stableData.map((row) => getRowId(row)) : []
  const selectedOnPage = pageIds.filter((id) => selectedSet.has(id)).length
  const allPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length

  if (stableData.length === 0) {
    return (
      <Paper withBorder p="md">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Table.ScrollContainer minWidth={720}>
        <Table>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {selection ? (
                  <Table.Th w={44} style={{ width: 44 }} onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      aria-label="Select all rows on this page"
                      checked={allPageSelected}
                      indeterminate={selectedOnPage > 0 && !allPageSelected}
                      onChange={(event) => togglePage(event.currentTarget.checked)}
                    />
                  </Table.Th>
                ) : null}
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id
                  const sortable = Boolean(sorting?.columns.includes(columnId))
                  const [activeField, direction] = (sorting?.value ?? '').split(',')
                  const active = sortable && activeField === columnId
                  return (
                  <Table.Th
                    key={header.id}
                    aria-sort={active ? (direction === 'desc' ? 'descending' : 'ascending') : undefined}
                  >
                    {header.isPlaceholder ? null : sortable && sorting ? (
                      <UnstyledButton
                        aria-label={`Sort by ${columnId}`}
                        onClick={() => sorting.onChange(toggleColumnSort(sorting.value, columnId))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                      >
                        <table.FlexRender header={header} />
                        {active && direction === 'desc' ? (
                          <ArrowDown size={14} />
                        ) : active ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.45 }} />
                        )}
                      </UnstyledButton>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </Table.Th>
                  )
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.map((row, index) => {
              const rowId = getRowId?.(row.original) ?? row.id
              const selected = selectedSet.has(rowId)
              return (
              <Table.Tr
                key={row.id}
                aria-selected={selected || undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : undefined,
                  background: selected
                    ? 'color-mix(in srgb, var(--mantine-color-brand-6) 10%, transparent)'
                    : undefined,
                }}
                onClick={() => onRowClick?.(row.original)}
              >
                {selection ? (
                  <Table.Td w={44} style={{ width: 44 }} onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      aria-label={
                        selection.getRowLabel ? `Select ${selection.getRowLabel(row.original)}` : 'Select row'
                      }
                      checked={selected}
                      onMouseDown={(event) => {
                        event.stopPropagation()
                        shiftKey.current = event.shiftKey
                        if (!event.shiftKey) anchor.current = index
                      }}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked
                        if (shiftKey.current && anchor.current != null) idsWith(checked, anchor.current, index)
                        else idsWith(checked, index, index)
                        anchor.current = index
                        shiftKey.current = false
                      }}
                    />
                  </Table.Td>
                ) : null}
                {row.getAllCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </Table.Td>
                ))}
              </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group justify="space-between" px="md" py="sm" style={{ borderTop: '1px solid var(--workfora-border)' }}>
        <Text size="sm" c="dimmed">
          {totalElements.toLocaleString()} total
        </Text>
        <Group gap="md">
          {onPageSizeChange ? (
            <Select
              size="xs"
              w={90}
              value={String(pageSize)}
              data={['10', '20', '50']}
              onChange={(value) => {
                if (value) onPageSizeChange(Number(value))
              }}
              aria-label="Rows per page"
            />
          ) : null}
          <Pagination
            size="sm"
            total={Math.max(totalPages, 1)}
            value={page + 1}
            onChange={(value) => onPageChange(value - 1)}
          />
        </Group>
      </Group>
    </Paper>
  )
}
