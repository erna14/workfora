import { ApiListPage } from '../../components/ui/ApiListPage'

export default function NotificationsPage() {
  return (
    <ApiListPage
      title="Notifications"
      description="In-app alerts and announcements"
      endpoint="/notifications?page=0&size=50"
      queryKey={['notifications']}
      columns={[
        { key: 'title', header: 'Title' },
        { key: 'body', header: 'Message' },
        { key: 'read', header: 'Read' },
        { key: 'createdAt', header: 'When' },
      ]}
    />
  )
}
