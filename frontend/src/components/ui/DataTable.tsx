import { Group, Pagination, Paper, Select, Table, Text } from '@mantine/core'
import {
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnDef,
  type TableFeatures,
} from '@tanstack/react-table'
import { useMemo } from 'react'
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
}: DataTableProps<TData>) {
  const stableData = useMemo(() => data, [data])

  const table = useTable({
    features: features as TableFeatures,
    columns,
    data: stableData,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  })

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
                {headerGroup.headers.map((header) => (
                  <Table.Th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.map((row) => (
              <Table.Tr
                key={row.id}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getAllCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
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
