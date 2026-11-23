import { Paper, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from './PageHeader'
import { QueryState } from './QueryState'
import { api } from '../../services/apiClient'
import type { PageResponse } from '../../types/api'

interface Column {
  key: string
  header: string
}

interface ApiListPageProps {
  title: string
  description: string
  endpoint: string
  queryKey: string[]
  columns: Column[]
  emptyTitle?: string
}

type LooseRecord = Record<string, unknown>

function asRows(payload: unknown): LooseRecord[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as LooseRecord[]
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const data = (payload as PageResponse<LooseRecord> | { data: LooseRecord }).data
    if (Array.isArray(data)) return data
  }
  return []
}

export function ApiListPage({
  title,
  description,
  endpoint,
  queryKey,
  columns,
  emptyTitle,
}: ApiListPageProps) {
  const query = useQuery({
    queryKey,
    queryFn: () => api.get<unknown>(endpoint),
  })

  const rows = asRows(query.data)

  return (
    <>
      <PageHeader title={title} description={description} />
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !query.isError && rows.length === 0}
        emptyTitle={emptyTitle ?? `No ${title.toLowerCase()} yet`}
        emptyDescription="This module is wired to the live API. Add records from the backend or UI actions when available."
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
                {rows.map((row, index) => (
                  <Table.Tr key={String(row.id ?? index)}>
                    {columns.map((col) => (
                      <Table.Td key={col.key}>
                        {formatCell(row[col.key])}
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

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Text c="dimmed">—</Text>
  }
  if (typeof value === 'object') {
    return <Text size="sm">{JSON.stringify(value)}</Text>
  }
  return <Text size="sm">{String(value)}</Text>
}
