import { createBrowserRouter, Navigate } from 'react-router'
import { lazy, Suspense, type ReactNode } from 'react'
import { Center, Loader } from '@mantine/core'
import { AppShellLayout } from '../layouts/AppShellLayout'
import { AuthLayout } from '../layouts/AuthLayout'
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

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <Lazy>
            <LoginPage />
          </Lazy>
        ),
      },
      {
        path: '/register',
        element: (
          <Lazy>
            <RegisterPage />
          </Lazy>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <Lazy>
            <VerifyEmailPage />
          </Lazy>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          {
            index: true,
            element: (
              <Lazy>
                <DashboardPage />
              </Lazy>
            ),
          },
          {
            path: 'employees',
            element: (
              <Lazy>
                <EmployeesPage />
              </Lazy>
            ),
          },
          {
            path: 'employees/new',
            element: (
              <Lazy>
                <EmployeeCreatePage />
              </Lazy>
            ),
          },
          {
            path: 'employees/:id',
            element: (
              <Lazy>
                <EmployeeProfilePage />
              </Lazy>
            ),
          },
          {
            path: 'organization/departments',
            element: (
              <Lazy>
                <DepartmentsPage />
              </Lazy>
            ),
          },
          {
            path: 'organization/positions',
            element: (
              <Lazy>
                <PositionsPage />
              </Lazy>
            ),
          },
          {
            path: 'organization/teams',
            element: (
              <Lazy>
                <TeamsPage />
              </Lazy>
            ),
          },
          {
            path: 'organization/locations',
            element: (
              <Lazy>
                <LocationsPage />
              </Lazy>
            ),
          },
          {
            path: 'attendance',
            element: (
              <Lazy>
                <AttendancePage />
              </Lazy>
            ),
          },
          {
            path: 'leave',
            element: (
              <Lazy>
                <LeavePage />
              </Lazy>
            ),
          },
          {
            path: 'recruitment',
            element: (
              <Lazy>
                <RecruitmentPage />
              </Lazy>
            ),
          },
          {
            path: 'onboarding',
            element: (
              <Lazy>
                <OnboardingPage />
              </Lazy>
            ),
          },
          {
            path: 'payroll',
            element: (
              <Lazy>
                <PayrollPage />
              </Lazy>
            ),
          },
          {
            path: 'performance',
            element: (
              <Lazy>
                <PerformancePage />
              </Lazy>
            ),
          },
          {
            path: 'assets',
            element: (
              <Lazy>
                <AssetsPage />
              </Lazy>
            ),
          },
          {
            path: 'notifications',
            element: (
              <Lazy>
                <NotificationsPage />
              </Lazy>
            ),
          },
          {
            path: 'reports',
            element: (
              <Lazy>
                <ReportsPage />
              </Lazy>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
