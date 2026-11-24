import { useComputedColorScheme } from '@mantine/core'
import { Outlet } from 'react-router'
import { ColorSchemeToggle } from '../../components/shared/ColorSchemeToggle'
import { WorkforaMark } from '../../components/shared/WorkforaMark'
import classes from './AuthLayout.module.css'

export function AuthLayout() {
  const colorScheme = useComputedColorScheme('light')
  const isDark = colorScheme === 'dark'
  const year = new Date().getFullYear()

  return (
    <div className={classes.root} data-dark={isDark || undefined}>
      <header className={classes.topBar}>
        <div className={classes.brandLockup}>
          <WorkforaMark size={30} />
          <span className={classes.brandName}>Workfora</span>
        </div>
        <ColorSchemeToggle />
      </header>

      <main className={classes.main}>
        <div className={classes.formFrame}>
          <Outlet />
        </div>
      </main>

      <footer className={classes.foot}>© {year} Workfora</footer>
    </div>
  )
}
