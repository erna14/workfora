import { usePositionsQuery } from './hooks'
import { OrgResourcePage } from './OrgResourcePage'

export default function PositionsPage() {
  const query = usePositionsQuery()
  return (
    <OrgResourcePage
      title="Positions"
      description="Job positions across departments"
      query={query}
      getRowId={(row) => row.id}
      columns={[
        { key: 'title', header: 'Title', render: (row) => row.title },
        { key: 'level', header: 'Level', render: (row) => row.level ?? '—' },
        {
          key: 'department',
          header: 'Department',
          render: (row) => row.departmentName ?? row.departmentId,
        },
      ]}
    />
  )
}
