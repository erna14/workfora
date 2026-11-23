import { useDepartmentsQuery } from './hooks'
import { OrgResourcePage } from './OrgResourcePage'

export default function DepartmentsPage() {
  const query = useDepartmentsQuery()
  return (
    <OrgResourcePage
      title="Departments"
      description="Organizational departments and hierarchy"
      query={query}
      getRowId={(row) => row.id}
      columns={[
        { key: 'code', header: 'Code', render: (row) => row.code },
        { key: 'name', header: 'Name', render: (row) => row.name },
        { key: 'description', header: 'Description', render: (row) => row.description ?? '—' },
      ]}
    />
  )
}
