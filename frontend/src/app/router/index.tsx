import { createBrowserRouter } from 'react-router'
import { lazy, Suspense, type ReactNode } from 'react'
import { Center, Loader } from '@mantine/core'
import { AppShellLayout } from '../layouts/AppShellLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { NotFoundPage, RouteErrorPage } from './RouteErrorPage'
import { ProtectedRoute } from './ProtectedRoute'

const LoginPage = lazy(() => import('../../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../../features/auth/RegisterPage'))
const VerifyEmailPage = lazy(() => import('../../features/auth/VerifyEmailPage'))
const DashboardPage = lazy(() => import('../../features/dashboard/DashboardPage'))
const EmployeesPage = lazy(() => import('../../features/employees/EmployeesPage'))
const EmployeeProfilePage = lazy(() => import('../../features/employees/EmployeeProfilePage'))
const EmployeeCreatePage = lazy(() => import('../../features/employees/EmployeeCreatePage'))
const DepartmentsPage = lazy(() => import('../../features/organization/DepartmentsPage'))
const PositionsPage = lazy(() => import('../../features/organization/PositionsPage'))
const TeamsPage = lazy(() => import('../../features/organization/TeamsPage'))
const LocationsPage = lazy(() => import('../../features/organization/LocationsPage'))
const AttendancePage = lazy(() => import('../../features/attendance/AttendancePage'))
const LeavePage = lazy(() => import('../../features/leave/LeavePage'))
const RecruitmentPage = lazy(() => import('../../features/recruitment/RecruitmentPage'))
const OnboardingPage = lazy(() => import('../../features/onboarding/OnboardingPage'))
const PayrollPage = lazy(() => import('../../features/payroll/PayrollPage'))
const PerformancePage = lazy(() => import('../../features/performance/PerformancePage'))
const AssetsPage = lazy(() => import('../../features/assets/AssetsPage'))
const AssetHistoryPage = lazy(() => import('../../features/assets/AssetHistoryPage'))
const NotificationsPage = lazy(() => import('../../features/notifications/NotificationsPage'))
const ReportsPage = lazy(() => import('../../features/reports/ReportsPage'))

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <Center py={80}>
          <Loader color="brand" />
        </Center>
      }
    >
      {children}
    </Suspense>
  )
}

function page(node: ReactNode) {
  return (
    <Lazy>
      {node}
    </Lazy>
  )
}

const appPages = [
  { index: true, element: page(<DashboardPage />) },
  { path: 'employees', element: page(<EmployeesPage />) },
  { path: 'employees/new', element: page(<EmployeeCreatePage />) },
  { path: 'employees/:id', element: page(<EmployeeProfilePage />) },
  { path: 'organization/departments', element: page(<DepartmentsPage />) },
  { path: 'organization/positions', element: page(<PositionsPage />) },
  { path: 'organization/teams', element: page(<TeamsPage />) },
  { path: 'organization/locations', element: page(<LocationsPage />) },
  { path: 'attendance', element: page(<AttendancePage />) },
  { path: 'leave', element: page(<LeavePage />) },
  { path: 'recruitment', element: page(<RecruitmentPage />) },
  { path: 'onboarding', element: page(<OnboardingPage />) },
  { path: 'payroll', element: page(<PayrollPage />) },
  { path: 'performance', element: page(<PerformancePage />) },
  { path: 'assets', element: page(<AssetsPage />) },
  { path: 'assets-history', element: page(<AssetHistoryPage />) },
  { path: 'notifications', element: page(<NotificationsPage />) },
  { path: 'reports', element: page(<ReportsPage />) },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/login', element: page(<LoginPage />) },
          { path: '/register', element: page(<RegisterPage />) },
          { path: '/verify-email', element: page(<VerifyEmailPage />) },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShellLayout />,
            children: [
              {
                errorElement: <RouteErrorPage />,
                children: appPages,
              },
            ],
          },
        ],
      },
    ],
  },
])
