import { useTeamsQuery } from './hooks'
import { OrgResourcePage } from './OrgResourcePage'

export default function TeamsPage() {
  const query = useTeamsQuery()
  return (
    <OrgResourcePage
      title="Teams"
      description="Teams within departments"
      query={query}
      getRowId={(row) => row.id}
      columns={[
        { key: 'name', header: 'Name', render: (row) => row.name },
        {
          key: 'department',
          header: 'Department',
          render: (row) => row.departmentName ?? row.departmentId,
        },
        { key: 'description', header: 'Description', render: (row) => row.description ?? '—' },
      ]}
    />
  )
}
