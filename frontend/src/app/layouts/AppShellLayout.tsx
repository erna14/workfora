import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Bell, ChevronLeft, ChevronRight, LogOut, Search, User } from 'lucide-react'
import { Link, NavLink as RouterNavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../providers/AuthProvider'
import { AppBreadcrumbs } from '../../components/shared/AppBreadcrumbs'
import { ColorSchemeToggle } from '../../components/shared/ColorSchemeToggle'
import { UserAvatar } from '../../components/shared/UserAvatar'
import { fullName } from '../../utils/format'
import { navGroups } from './navConfig'

export function AppShellLayout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
  const [collapsed, { toggle: toggleCollapsed }] = useDisclosure(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const colorScheme = useComputedColorScheme('light')

  const navbarWidth = collapsed ? 76 : 260
  const isDark = colorScheme === 'dark'
  const surfaceBorder = '1px solid var(--workfora-border)'
  const chromeBg = isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-body)'

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: navbarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <AppShell.Header
        px="md"
        style={{
          borderBottom: surfaceBorder,
          background: chromeBg,
        }}
      >
        <Group h="100%" justify="space-between">
          <Group gap="sm">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Title order={4} c={isDark ? 'brand.3' : 'brand.7'} visibleFrom="sm">
              Workfora
            </Title>
            <TextInput
              placeholder="Search people, teams…"
              leftSection={<Search size={16} />}
              w={320}
              visibleFrom="md"
              radius="md"
            />
          </Group>

          <Group gap="xs">
            <ColorSchemeToggle />
            <Tooltip label="Notifications">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                component={Link}
                to="/notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="sm">
                    <UserAvatar firstName={user?.firstName} lastName={user?.lastName} />
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={500} lh={1.2}>
                        {fullName(user?.firstName, user?.lastName) || user?.email}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user?.roles?.[0]?.replaceAll('_', ' ') ?? 'User'}
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Item leftSection={<User size={16} />} onClick={() => navigate('/employees')}>
                  Directory
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<LogOut size={16} />}
                  onClick={() => {
                    void logout().then(() => navigate('/login'))
                  }}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="sm"
        style={{
          borderRight: surfaceBorder,
          background: chromeBg,
        }}
      >
        <AppShell.Section grow component={ScrollArea} type="hover" offsetScrollbars>
          {navGroups.map((group) => (
            <Box key={group.label} mb="md">
              {!collapsed ? (
                <Text size="xs" tt="uppercase" fw={600} c="dimmed" px="sm" mb={6}>
                  {group.label}
                </Text>
              ) : null}
              {group.items.map((item) => (
                <Tooltip key={item.to} label={item.label} position="right" disabled={!collapsed}>
                  <NavLink
                    component={RouterNavLink}
                    to={item.to}
                    end={item.to === '/'}
                    label={collapsed ? undefined : item.label}
                    aria-label={collapsed ? item.label : undefined}
                    leftSection={item.icon}
                    onClick={() => {
                      if (mobileOpened) toggleMobile()
                    }}
                    styles={{
                      root: {
                        borderRadius: 8,
                        marginBottom: 2,
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))}
        </AppShell.Section>

        <AppShell.Section>
          <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={toggleCollapsed}
              visibleFrom="sm"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </ActionIcon>
          </Tooltip>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg={isDark ? 'dark.8' : 'slate.0'}>
        <Box maw={1280} mx="auto">
          <AppBreadcrumbs />
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}
