import { ApiListPage } from '../../components/ui/ApiListPage'

export default function OnboardingPage() {
  return (
    <ApiListPage
      title="Onboarding"
      description="New hire checklists and progress"
      endpoint="/onboarding/assignments?page=0&size=50"
      queryKey={['onboarding', 'assignments']}
      columns={[
        { key: 'employeeName', header: 'Employee' },
        { key: 'templateName', header: 'Template' },
        { key: 'status', header: 'Status' },
        { key: 'dueDate', header: 'Due' },
        { key: 'progressPercent', header: 'Progress' },
      ]}
    />
  )
}
