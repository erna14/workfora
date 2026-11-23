import { Paper, Table, Text } from '@mantine/core'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import type { PageResponse } from '../../types/api'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
}

interface OrgResourcePageProps<T> {
  title: string
  description: string
  query: UseQueryResult<PageResponse<T>>
  columns: Array<Column<T>>
  getRowId: (row: T) => string
}

export function OrgResourcePage<T>({
  title,
  description,
  query,
  columns,
  getRowId,
}: OrgResourcePageProps<T>) {
  const rows = query.data?.data ?? []

  return (
    <>
      <PageHeader title={title} description={description} />
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !query.isError && rows.length === 0}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        emptyDescription="Records will appear here once created via the API."
      >
        <Paper withBorder>
          <Table.ScrollContainer minWidth={640}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  {columns.map((col) => (
                    <Table.Th key={col.key}>{col.header}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={getRowId(row)}>
                    {columns.map((col) => (
                      <Table.Td key={col.key}>
                        {col.render(row) ?? <Text c="dimmed">—</Text>}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </QueryState>
    </>
  )
}
