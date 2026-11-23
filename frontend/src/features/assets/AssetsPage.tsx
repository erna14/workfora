import { ApiListPage } from '../../components/ui/ApiListPage'

export default function AssetsPage() {
  return (
    <ApiListPage
      title="Assets"
      description="Company assets and assignments"
      endpoint="/assets?page=0&size=50"
      queryKey={['assets']}
      columns={[
        { key: 'name', header: 'Asset' },
        { key: 'categoryName', header: 'Category' },
        { key: 'serialNumber', header: 'Serial' },
        { key: 'status', header: 'Status' },
        { key: 'assignedToName', header: 'Assigned to' },
      ]}
    />
  )
}
