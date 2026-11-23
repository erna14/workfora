import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  MapPin,
  Network,
  Package,
  Rocket,
  Target,
  Users,
  Wallet,
  Bell,
} from 'lucide-react'
import type { ReactNode } from 'react'

export interface NavItem {
  label: string
  to: string
  icon: ReactNode
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const iconProps = { size: 18, strokeWidth: 1.75 }

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: <LayoutDashboard {...iconProps} /> }],
  },
  {
    label: 'People',
    items: [
      { label: 'Employees', to: '/employees', icon: <Users {...iconProps} /> },
      { label: 'Departments', to: '/organization/departments', icon: <Building2 {...iconProps} /> },
      { label: 'Positions', to: '/organization/positions', icon: <Briefcase {...iconProps} /> },
      { label: 'Teams', to: '/organization/teams', icon: <Network {...iconProps} /> },
      { label: 'Locations', to: '/organization/locations', icon: <MapPin {...iconProps} /> },
    ],
  },
  {
    label: 'Time & Leave',
    items: [
      { label: 'Attendance', to: '/attendance', icon: <Clock3 {...iconProps} /> },
      { label: 'Leave', to: '/leave', icon: <CalendarDays {...iconProps} /> },
    ],
  },
  {
    label: 'Hire',
    items: [
      { label: 'Recruitment', to: '/recruitment', icon: <ClipboardList {...iconProps} /> },
      { label: 'Onboarding', to: '/onboarding', icon: <Rocket {...iconProps} /> },
    ],
  },
  {
    label: 'Compensation',
    items: [
      { label: 'Payroll', to: '/payroll', icon: <Wallet {...iconProps} /> },
      { label: 'Performance', to: '/performance', icon: <Target {...iconProps} /> },
      { label: 'Assets', to: '/assets', icon: <Package {...iconProps} /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Notifications', to: '/notifications', icon: <Bell {...iconProps} /> },
      { label: 'Reports', to: '/reports', icon: <BarChart3 {...iconProps} /> },
    ],
  },
]
