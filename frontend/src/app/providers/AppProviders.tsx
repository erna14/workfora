import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { theme } from '../../lib/theme'
import { queryClient } from '../../lib/queryClient'
import { AuthProvider } from './AuthProvider'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/charts/styles.css'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <DatesProvider settings={{ consistentWeeks: true }}>
          <Notifications position="top-right" zIndex={4000} />
          <AuthProvider>{children}</AuthProvider>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  )
}
