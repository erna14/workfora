import { ApiListPage } from '../../components/ui/ApiListPage'

export default function RecruitmentPage() {
  return (
    <ApiListPage
      title="Recruitment"
      description="Open roles and applicant pipeline"
      endpoint="/recruitment/jobs?page=0&size=50"
      queryKey={['recruitment', 'jobs']}
      columns={[
        { key: 'title', header: 'Job' },
        { key: 'departmentName', header: 'Department' },
        { key: 'status', header: 'Status' },
        { key: 'openings', header: 'Openings' },
        { key: 'createdAt', header: 'Created' },
      ]}
    />
  )
}
