import { ApiListPage } from '../../components/ui/ApiListPage'

export default function LeavePage() {
  return (
    <ApiListPage
      title="Leave"
      description="Leave requests, balances, and approvals"
      endpoint="/leave/requests?page=0&size=50"
      queryKey={['leave', 'requests']}
      columns={[
        { key: 'employeeName', header: 'Employee' },
        { key: 'leaveTypeName', header: 'Type' },
        { key: 'startDate', header: 'Start' },
        { key: 'endDate', header: 'End' },
        { key: 'status', header: 'Status' },
      ]}
    />
  )
}
