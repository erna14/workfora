import { Center, Loader, Stack, Text } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../providers/AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="sm">
          <Loader color="brand" />
          <Text size="sm" c="dimmed">
            Restoring session…
          </Text>
        </Stack>
      </Center>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
