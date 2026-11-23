import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core'
import { AlertCircle } from 'lucide-react'
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
      <Alert
        color="red"
        variant="light"
        title="Unable to load data"
        icon={<AlertCircle size={18} />}
      >
        <Stack gap="sm">
          <Text size="sm">{errorMessage(error)}</Text>
          {onRetry ? (
            <Button size="xs" variant="light" color="red" w="fit-content" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </Stack>
      </Alert>
    )
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return <>{children}</>
}
