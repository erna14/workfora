import { ActionIcon, Button, Stack, Tooltip } from '@mantine/core'
import { SlidersHorizontal } from 'lucide-react'
import { Children, Fragment, isValidElement, useEffect, useState, type ReactNode } from 'react'
import { AppDrawer } from './AppDrawer'
import classes from './TableToolbar.module.css'

interface TableToolbarProps {
  filters: ReactNode
  actions?: ReactNode
  filtersActive?: boolean
}

function useIsMobile(query = '(max-width: 48em)') {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function flatten(nodes: ReactNode): ReactNode[] {
  const fields: ReactNode[] = []
  Children.forEach(nodes, (child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      fields.push(...flatten(child.props.children))
      return
    }
    if (child != null && child !== false) fields.push(child)
  })
  return fields
}

export function TableToolbar({ filters, actions, filtersActive = false }: TableToolbarProps) {
  const isMobile = useIsMobile()
  const [opened, setOpened] = useState(false)
  const fields = flatten(filters)
  const filterLabel = filtersActive ? 'Filters, in use' : 'Filters'

  useEffect(() => {
    if (!isMobile) setOpened(false)
  }, [isMobile])

  return (
    <>
      <div className={classes.toolbar}>
        {isMobile ? null : (
          <div className={classes.filters}>
            {fields.map((field, index) => (
              <div key={index} className={index === 0 ? classes.search : classes.field}>
                {field}
              </div>
            ))}
          </div>
        )}
        <div className={classes.actions}>
          {isMobile ? (
            <Tooltip label={filterLabel}>
              <ActionIcon
                variant={filtersActive ? 'light' : 'default'}
                color={filtersActive ? 'blue' : undefined}
                size="lg"
                aria-label={filterLabel}
                aria-expanded={opened}
                onClick={() => setOpened(true)}
                style={
                  filtersActive
                    ? {
                        color: 'var(--mantine-color-blue-light-color)',
                        background: 'var(--mantine-color-blue-light)',
                      }
                    : undefined
                }
              >
                <SlidersHorizontal size={16} />
              </ActionIcon>
            </Tooltip>
          ) : null}
          {actions}
        </div>
      </div>
      <AppDrawer opened={isMobile && opened} onClose={() => setOpened(false)} title="Filters">
        {isMobile ? (
          <Stack gap="md">
            {fields}
            <Button onClick={() => setOpened(false)}>Done</Button>
          </Stack>
        ) : null}
      </AppDrawer>
    </>
  )
}
