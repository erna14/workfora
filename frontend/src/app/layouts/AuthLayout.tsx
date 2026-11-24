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
      <aside className={classes.brandPane} aria-label="Workfora">
        <div className={classes.brandTop}>
          <div className={classes.brandLockup}>
            <WorkforaMark size={32} />
            <span className={classes.brandName}>Workfora</span>
          </div>
        </div>

        <div className={classes.brandCopy}>
          <p className={classes.brandEyebrow}>Workforce platform</p>
          <h1 className={classes.brandTitle}>People operations, clearly organized.</h1>
          <p className={classes.brandSubtitle}>
            Sign in to manage attendance, leave, and your team from one secure workspace.
          </p>
        </div>

        <p className={classes.brandFoot}>© {year} Workfora</p>
      </aside>

      <section className={classes.formPane}>
        <div className={classes.formPaneTop}>
          <div className={classes.mobileBrand}>
            <WorkforaMark size={28} />
            <span className={classes.mobileBrandName}>Workfora</span>
          </div>
          <div className={classes.themeToggle}>
            <ColorSchemeToggle />
          </div>
        </div>

        <div className={classes.formPaneBody}>
          <div className={classes.formFrame}>
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  )
}
