import { Anchor, Breadcrumbs, Text } from '@mantine/core'
import { Link, useLocation } from 'react-router'

const LABELS: Record<string, string> = {
  '': 'Dashboard',
  employees: 'Employees',
  new: 'New',
  organization: 'Organization',
  departments: 'Departments',
  positions: 'Positions',
  teams: 'Teams',
  locations: 'Locations',
  attendance: 'Attendance',
  leave: 'Leave',
  recruitment: 'Recruitment',
  onboarding: 'Onboarding',
  payroll: 'Payroll',
  performance: 'Performance',
  assets: 'Assets',
  notifications: 'Notifications',
  reports: 'Reports',
}

function labelFor(segment: string, index: number, parts: string[]): string {
  if (LABELS[segment]) return LABELS[segment]
  if (parts[index - 1] === 'employees' && segment !== 'new') return 'Profile'
  return segment
}

export function AppBreadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  // Home uses its own greeting header — skip redundant breadcrumb.
  if (parts.length === 0) {
    return null
  }

  const items = [
    <Anchor key="home" component={Link} to="/" size="sm" c="dimmed">
      Home
    </Anchor>,
    ...parts.map((segment, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/')
      const isLast = index === parts.length - 1
      const label = labelFor(segment, index, parts)
      if (isLast) {
        return (
          <Text key={path} size="sm" fw={500}>
            {label}
          </Text>
        )
      }
      return (
        <Anchor key={path} component={Link} to={path} size="sm" c="dimmed">
          {label}
        </Anchor>
      )
    }),
  ]

  return <Breadcrumbs mb="sm">{items}</Breadcrumbs>
}
