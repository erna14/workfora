import { Alert, Button, PasswordInput, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../app/providers/AuthProvider'
import { errorMessage } from '../../utils/format'
import { loginSchema } from './schemas'
import classes from './LoginPage.module.css'

function formatFieldError(errors: unknown[]): string | undefined {
  const first = errors[0]
  if (!first) return undefined
  if (typeof first === 'string') return first
  if (typeof first === 'object' && first && 'message' in first) {
    return String((first as { message: unknown }).message)
  }
  return String(first)
}

export default function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await login(value.email, value.password)
        navigate(from, { replace: true })
      } catch (err) {
        setError(errorMessage(err, 'Invalid email or password'))
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
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <Stack gap={18}>
        {error ? (
          <Alert color="red" variant="light" radius="md" className={classes.alert}>
            {error}
          </Alert>
        ) : null}

        <form.Field name="email">
          {(field) => (
            <TextInput
              label="Email"
              placeholder="name@company.com"
              size="md"
              radius="md"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={formatFieldError(field.state.meta.errors)}
              autoComplete="username"
              autoFocus
              classNames={{ label: classes.label, input: classes.input }}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              size="md"
              radius="md"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.currentTarget.value)}
              error={formatFieldError(field.state.meta.errors)}
              autoComplete="current-password"
              classNames={{ label: classes.label, input: classes.input }}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size="md"
              radius="md"
              fullWidth
              loading={isSubmitting}
              disabled={!canSubmit}
              className={classes.submit}
              mt={4}
            >
              Continue
            </Button>
          )}
        </form.Subscribe>

        <Stack gap={6} mt={6} className={classes.hint}>
          <Text size="xs" c="dimmed" ta="center">
            Demo accounts · password <Text span fw={500}>Admin123!</Text>
          </Text>
          <div className={classes.demoRoles}>
            {(
              [
                { email: 'admin@workfora.com', label: 'Admin' },
                { email: 'manager@workfora.com', label: 'Manager' },
                { email: 'employee@workfora.com', label: 'Employee' },
              ] as const
            ).map((account) => (
              <UnstyledButton
                key={account.email}
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
        </Stack>
      </Stack>
    </form>
  )
}
