import { Badge } from '@mantine/core'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  ONBOARDING: 'blue',
  TERMINATED: 'red',
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  DRAFT: 'gray',
  OPEN: 'blue',
  CLOSED: 'gray',
  PRESENT: 'green',
  LATE: 'orange',
  ABSENT: 'red',
  ASSIGNED: 'blue',
  RETURNED: 'gray',
  MAINTENANCE: 'orange',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? 'gray'
  return (
    <Badge color={color} variant="light" radius="sm" tt="capitalize" fw={600}>
      {status.replaceAll('_', ' ').toLowerCase()}
    </Badge>
  )
}
