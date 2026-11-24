import { Drawer, type DrawerProps } from '@mantine/core'

/** Project overlay. Always opens from the right. */
export function AppDrawer(props: DrawerProps) {
  return <Drawer size={440} {...props} position="right" />
}
