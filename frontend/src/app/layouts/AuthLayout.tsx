import { Box, Group, Stack, Text, Title, useComputedColorScheme } from '@mantine/core'
import { Outlet } from 'react-router'
import { ColorSchemeToggle } from '../../components/shared/ColorSchemeToggle'
import classes from './AuthLayout.module.css'

export function AuthLayout() {
  const colorScheme = useComputedColorScheme('light')
  const isDark = colorScheme === 'dark'

  return (
    <Box className={classes.root} data-dark={isDark || undefined}>
      <Group className={classes.topBar} justify="space-between">
        <Text className={classes.topBrand} visibleFrom="xs">
          Workfora
        </Text>
        <ColorSchemeToggle />
      </Group>

      <Box className={classes.stage}>
        <Stack className={classes.panel} gap={0}>
          <Stack gap={8} mb={36} className={classes.intro}>
            <Title order={1} className={classes.headline}>
              Welcome back
            </Title>
            <Text className={classes.subhead}>
              Sign in to continue to your workspace.
            </Text>
          </Stack>
          <Outlet />
        </Stack>
      </Box>
    </Box>
  )
}
