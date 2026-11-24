import { Anchor, Button, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '../../types/api'
import { resendVerification, verifyEmail } from './api'
import classes from './RegisterPage.module.css'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const tokenFromQuery = params.get('token')?.trim() ?? ''
  const [email, setEmail] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState(
    tokenFromQuery
      ? 'Confirming your email…'
      : 'Paste the verification token from your email, or request a new link.',
  )

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      setStatus('success')
      setMessage(data.message)
    },
    onError: (error) => {
      setStatus('error')
      setMessage(
        error instanceof ApiError && error.message
          ? error.message
          : 'Verification failed. The link may be invalid or expired.',
      )
    },
  })

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (data) => {
      notifications.show({
        color: 'teal',
        title: 'Verification email',
        message: data.message,
      })
      if (data.developmentVerificationToken) {
        setMessage(`Dev token: ${data.developmentVerificationToken}`)
      }
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Unable to resend',
        message: 'Please wait a moment and try again.',
      })
    },
  })

  useEffect(() => {
    if (!tokenFromQuery) return
    verifyMutation.mutate(tokenFromQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per token
  }, [tokenFromQuery])

  return (
    <div className={classes.form}>
      <header className={classes.header}>
        <h1 className={classes.title}>
          {status === 'success' ? 'Email verified' : 'Verify your email'}
        </h1>
        <p className={classes.subtitle}>{message}</p>
      </header>

      {status === 'success' ? (
        <div className={classes.actions}>
          <Button component={Link} to="/login" size="md" radius="md" className={classes.submit}>
            Continue to sign in
          </Button>
        </div>
      ) : (
        <>
          {!tokenFromQuery ? (
            <form
              className={classes.fields}
              onSubmit={(event) => {
                event.preventDefault()
                if (manualToken.trim()) {
                  verifyMutation.mutate(manualToken.trim())
                }
              }}
            >
              <div className={classes.field}>
                <TextInput
                  label="Verification token"
                  size="md"
                  radius="md"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.currentTarget.value)}
                  classNames={{ label: classes.label, input: classes.input }}
                />
                <div className={classes.errorSpace}>{'\u00a0'}</div>
              </div>
              <Button
                type="submit"
                size="md"
                radius="md"
                className={classes.submit}
                loading={verifyMutation.isPending}
              >
                Verify email
              </Button>
            </form>
          ) : null}

          {status === 'error' || !tokenFromQuery ? (
            <div style={{ marginTop: '1.25rem' }}>
              <p className={classes.subtitle}>Need a new link?</p>
              <div className={classes.fields}>
                <div className={classes.field}>
                  <TextInput
                    label="Work email"
                    size="md"
                    radius="md"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    classNames={{ label: classes.label, input: classes.input }}
                  />
                </div>
                <Button
                  size="md"
                  radius="md"
                  className={classes.submit}
                  loading={resendMutation.isPending}
                  onClick={() => {
                    if (!email.trim()) return
                    resendMutation.mutate(email.trim())
                  }}
                >
                  Resend verification
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <div className={classes.footer}>
        <Anchor component={Link} to="/login" className={classes.footerLink}>
          Back to sign in
        </Anchor>
      </div>
    </div>
  )
}
