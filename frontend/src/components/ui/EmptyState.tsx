import { Button, Center, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
  color?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  color = 'brand',
}: EmptyStateProps) {
  return (
    <Center py={64} px="md">
      <Stack align="center" gap="sm" maw={420}>
        <ThemeIcon size={56} radius="xl" variant="light" color={color}>
          {icon ?? <Inbox size={28} />}
        </ThemeIcon>
        <Title order={4} ta="center">
          {title}
        </Title>
        {description ? (
          <Text size="sm" c="dimmed" ta="center">
            {description}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Button mt="xs" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Center>
  )
}
