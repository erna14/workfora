import { Anchor, Button, Checkbox, PasswordInput, TextInput, UnstyledButton } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../app/providers/AuthProvider'
import { ApiError } from '../../types/api'
import { loginSchema } from './schemas'
import classes from './LoginPage.module.css'

const REMEMBER_KEY = 'workfora.login.rememberEmail'

const DEMO_ACCOUNTS = [
  { email: 'admin@workfora.com', label: 'Admin' },
  { email: 'manager@workfora.com', label: 'Manager' },
  { email: 'employee@workfora.com', label: 'Employee' },
] as const

function formatFieldError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (!error) continue
    if (typeof error === 'string') return error
    if (typeof error === 'object' && 'message' in error) {
      const message = (error as { message: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
  }
  return undefined
}

function validateEmail(value: string): string | undefined {
  const result = loginSchema.shape.email.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

function validatePassword(value: string): string | undefined {
  const result = loginSchema.shape.password.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

function readRememberedEmail(): { email: string; rememberMe: boolean } {
  try {
    const email = localStorage.getItem(REMEMBER_KEY) ?? ''
    return { email, rememberMe: Boolean(email) }
  } catch {
    return { email: '', rememberMe: false }
  }
}

function loginFailureNotice(error: unknown): { title: string; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        title: 'Sign-in failed',
        message: 'Invalid email or password. Please try again.',
      }
    }
    if (error.status === 403) {
      return {
        title: 'Access denied',
        message:
          'This account cannot sign in yet. If you just registered, verify your email first.',
      }
    }
    if (error.status >= 500) {
      return {
        title: 'Server unavailable',
        message: 'We could not complete sign-in right now. Please try again shortly.',
      }
    }
  }

  return {
    title: 'Sign-in failed',
    message: 'Unable to reach the server. Check your connection and try again.',
  }
}

export default function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const remembered = readRememberedEmail()

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const form = useForm({
    defaultValues: {
      email: remembered.email,
      password: '',
      rememberMe: remembered.rememberMe,
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.rememberMe) {
          localStorage.setItem(REMEMBER_KEY, value.email.trim())
        } else {
          localStorage.removeItem(REMEMBER_KEY)
        }
      } catch {
        // Ignore storage failures in private browsing.
      }

      try {
        await login(value.email, value.password)
        navigate(from, { replace: true })
      } catch (err) {
        const notice = loginFailureNotice(err)
        notifications.show({
          color: 'red',
          title: notice.title,
          message: notice.message,
        })
      }
    },
  })

  if (isBootstrapping) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <form
      className={classes.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <header className={classes.header}>
        <h1 className={classes.title}>Welcome back</h1>
        <p className={classes.subtitle}>
          Enter your work email and password to continue to Workfora.
        </p>
      </header>

      <div className={classes.fields}>
        <form.Subscribe selector={(state) => state.submissionAttempts}>
          {(submissionAttempts) => {
            const showFieldErrors = submissionAttempts > 0

            return (
              <>
                <form.Field
                  name="email"
                  validators={{
                    onSubmit: ({ value }) => validateEmail(value),
                  }}
                >
                  {(field) => {
                    const message = formatFieldError(field.state.meta.errors)
                    const showError = showFieldErrors && Boolean(message)

                    return (
                      <div className={classes.field}>
                        <TextInput
                          label="Email address"
                          placeholder="name@company.com"
                          size="md"
                          radius="md"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.currentTarget.value)}
                          error={showError}
                          autoComplete="username"
                          autoFocus={!remembered.email}
                          classNames={{ label: classes.label, input: classes.input }}
                        />
                        <div className={classes.errorSpace} aria-live="polite">
                          {showError ? message : '\u00a0'}
                        </div>
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field
                  name="password"
                  validators={{
                    onSubmit: ({ value }) => validatePassword(value),
                  }}
                >
                  {(field) => {
                    const message = formatFieldError(field.state.meta.errors)
                    const showError = showFieldErrors && Boolean(message)

                    return (
                      <div className={classes.field}>
                        <PasswordInput
                          label="Password"
                          placeholder="Enter your password"
                          size="md"
                          radius="md"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.currentTarget.value)}
                          error={showError}
                          autoComplete="current-password"
                          visibilityToggleButtonProps={{
                            'aria-label': 'Toggle password visibility',
                          }}
                          classNames={{ label: classes.label, input: classes.input }}
                        />
                        <div className={classes.errorSpace} aria-live="polite">
                          {showError ? message : '\u00a0'}
                        </div>
                      </div>
                    )
                  }}
                </form.Field>
              </>
            )
          }}
        </form.Subscribe>

        <div className={classes.row}>
          <form.Field name="rememberMe">
            {(field) => (
              <Checkbox
                label="Remember me"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.currentTarget.checked)}
                size="sm"
              />
            )}
          </form.Field>

          <Anchor
            href="#forgot-password"
            className={classes.forgot}
            onClick={(event) => {
              event.preventDefault()
              notifications.show({
                color: 'gray',
                title: 'Password reset',
                message: 'Password recovery will be available in a later release.',
              })
            }}
          >
            Forgot password?
          </Anchor>
        </div>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              size="md"
              radius="md"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              className={classes.submit}
            >
              Sign in
            </Button>
          )}
        </form.Subscribe>

        <p className={classes.demoHint} style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Anchor component={Link} to="/register" className={classes.forgot}>
            Create your organization
          </Anchor>
        </p>

        <div className={classes.demo}>
          <p className={classes.demoHint}>
            Demo accounts · password <span className={classes.demoPassword}>Admin123!</span>
          </p>
          <div className={classes.demoRoles}>
            {DEMO_ACCOUNTS.map((account) => (
              <UnstyledButton
                key={account.email}
                type="button"
                className={classes.demoFill}
                onClick={() => {
                  form.setFieldValue('email', account.email)
                  form.setFieldValue('password', 'Admin123!')
                }}
              >
                {account.label}
              </UnstyledButton>
            ))}
          </div>
        </div>
      </div>

      <footer className={classes.footer}>
        <Anchor
          href="#privacy"
          className={classes.footerLink}
          onClick={(event) => event.preventDefault()}
        >
          Privacy Policy
        </Anchor>
        <Anchor
          href="#terms"
          className={classes.footerLink}
          onClick={(event) => event.preventDefault()}
        >
          Terms of Service
        </Anchor>
      </footer>
    </form>
  )
}
