import { Card, SimpleGrid, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { api } from '../../services/apiClient'
import type { ApiResponse } from '../../types/api'

interface ReportSummary {
  employeeCount?: number
  attendanceRate?: number
  leaveUtilization?: number
  openRoles?: number
  turnoverRate?: number
}

function isApiResponse(value: unknown): value is ApiResponse<ReportSummary> {
  return Boolean(value && typeof value === 'object' && 'data' in value)
}

export default function ReportsPage() {
  const query = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async (): Promise<ReportSummary> => {
      const response = await api.get<ApiResponse<ReportSummary> | ReportSummary>('/reports/summary')
      if (isApiResponse(response)) {
        return response.data
      }
      return response
    },
  })

  const data = query.data

  return (
    <>
      <PageHeader
        title="Reports"
        description="Workforce analytics and exportable summaries"
      />
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          <Metric title="Employees" value={data?.employeeCount} />
          <Metric title="Attendance rate" value={data?.attendanceRate} suffix="%" />
          <Metric title="Leave utilization" value={data?.leaveUtilization} suffix="%" />
          <Metric title="Open roles" value={data?.openRoles} />
          <Metric title="Turnover rate" value={data?.turnoverRate} suffix="%" />
        </SimpleGrid>
      </QueryState>
    </>
  )
}

function Metric({
  title,
  value,
  suffix = '',
}: {
  title: string
  value?: number
  suffix?: string
}) {
  return (
    <Card padding="lg">
      <Text size="sm" c="dimmed">
        {title}
      </Text>
      <Title order={2} mt={4}>
        {value === undefined || value === null ? '—' : `${value}${suffix}`}
      </Title>
    </Card>
  )
}
