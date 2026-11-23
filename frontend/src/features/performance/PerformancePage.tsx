import { ApiListPage } from '../../components/ui/ApiListPage'

export default function PerformancePage() {
  return (
    <ApiListPage
      title="Performance"
      description="Review cycles, goals, and evaluations"
      endpoint="/performance/cycles?page=0&size=50"
      queryKey={['performance', 'cycles']}
      columns={[
        { key: 'name', header: 'Cycle' },
        { key: 'status', header: 'Status' },
        { key: 'startDate', header: 'Start' },
        { key: 'endDate', header: 'End' },
      ]}
    />
  )
}
