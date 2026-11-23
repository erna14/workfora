import { useLocationsQuery } from './hooks'
import { OrgResourcePage } from './OrgResourcePage'

export default function LocationsPage() {
  const query = useLocationsQuery()
  return (
    <OrgResourcePage
      title="Locations"
      description="Offices and work locations"
      query={query}
      getRowId={(row) => row.id}
      columns={[
        { key: 'name', header: 'Name', render: (row) => row.name },
        { key: 'city', header: 'City', render: (row) => row.city ?? '—' },
        { key: 'country', header: 'Country', render: (row) => row.country ?? '—' },
        { key: 'timezone', header: 'Timezone', render: (row) => row.timezone },
      ]}
    />
  )
}
