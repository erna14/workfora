import { Button, Center, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { AlertTriangle, FileQuestion } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { routeErrorCopy } from './routeError'

function devDetail(error: unknown): string | null {
  if (!import.meta.env.DEV) return null
  if (isRouteErrorResponse(error)) {
    if (typeof error.data === 'string' && error.data) return error.data
    return error.statusText ? `${error.status} ${error.statusText}` : null
  }
  if (error instanceof Error && error.message) return error.message
  return null
}

function ErrorPanel({
  title,
  description,
  notFound,
  detail,
}: {
  title: string
  description: string
  notFound: boolean
  detail?: string | null
}) {
  return (
    <Center py={80} px="md">
      <Stack align="center" gap="sm" maw={440}>
        <ThemeIcon size={56} radius="xl" variant="light" color={notFound ? 'brand' : 'red'}>
          {notFound ? <FileQuestion size={28} /> : <AlertTriangle size={28} />}
        </ThemeIcon>
        <Title order={3} ta="center">
          {title}
        </Title>
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
        {detail ? (
          <Text size="xs" c="dimmed" ta="center" ff="monospace">
            {detail}
          </Text>
        ) : null}
        <Group mt="xs" justify="center">
          {notFound ? null : (
            <Button variant="default" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
          <Button component={Link} to="/">
            Dashboard
          </Button>
        </Group>
      </Stack>
    </Center>
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  const copy = routeErrorCopy(isRouteErrorResponse(error) ? error.status : null)
  return <ErrorPanel {...copy} detail={devDetail(error)} />
}

export function NotFoundPage() {
  const copy = routeErrorCopy(404)
  return <ErrorPanel {...copy} />
}
