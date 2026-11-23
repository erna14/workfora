import { ApiListPage } from '../../components/ui/ApiListPage'

export default function PayrollPage() {
  return (
    <ApiListPage
      title="Payroll"
      description="Payroll periods and payslips"
      endpoint="/payroll/periods?page=0&size=50"
      queryKey={['payroll', 'periods']}
      columns={[
        { key: 'name', header: 'Period' },
        { key: 'startDate', header: 'Start' },
        { key: 'endDate', header: 'End' },
        { key: 'status', header: 'Status' },
        { key: 'payDate', header: 'Pay date' },
      ]}
    />
  )
}
