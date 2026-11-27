import { Center, Loader, Paper, Stack, Text } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { errorMessage } from '../../utils/format'
import { EmptyState } from './EmptyState'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  error?: unknown
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRetry?: () => void
  children: ReactNode
}

export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  onRetry,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <Center py={80}>
        <Stack align="center" gap="sm">
          <Loader color="brand" />
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        </Stack>
      </Center>
    )
  }

  if (isError) {
    return (
      <Paper withBorder>
        <EmptyState
          icon={<AlertTriangle size={28} />}
          color="gray"
          title="Couldn't load this"
          description={loadErrorCopy(error)}
          actionLabel={onRetry ? 'Try again' : undefined}
          onAction={onRetry}
        />
      </Paper>
    )
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return <>{children}</>
}

function loadErrorCopy(error: unknown): string {
  const message = errorMessage(error, '')
  if (!message || message === 'An unexpected error occurred' || message === 'Something went wrong') {
    return 'The information did not come back. Try again in a moment.'
  }
  return message
}
