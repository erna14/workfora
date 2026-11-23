import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, login as loginApi, logout as logoutApi, refreshSession } from '../../features/auth/api'
import { tokenStore } from '../../services/tokenStore'
import type { AuthUser } from '../../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Deduplicate StrictMode double-mount bootstrap in development. */
let bootstrapPromise: Promise<AuthUser | null> | null = null

async function bootstrapSession(): Promise<AuthUser | null> {
  if (tokenStore.get()) {
    return fetchMe()
  }

  // No prior login on this browser — skip refresh to avoid noisy 401s.
  if (!tokenStore.hasSessionHint()) {
    return null
  }

  const refreshed = await refreshSession()
  if (!refreshed) {
    return null
  }

  if (refreshed.user) {
    return refreshed.user
  }

  if (tokenStore.get()) {
    return fetchMe()
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!bootstrapPromise) {
      bootstrapPromise = bootstrapSession().finally(() => {
        // Allow a later remount (e.g. after logout/login) to bootstrap again.
        queueMicrotask(() => {
          bootstrapPromise = null
        })
      })
    }

    void bootstrapPromise
      .then((nextUser) => {
        if (!cancelled) setUser(nextUser)
      })
      .catch(() => {
        tokenStore.clear()
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    await logoutApi()
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => user?.permissions?.includes(permission) ?? false,
    [user],
  )

  const hasRole = useCallback(
    (...roles: string[]) => roles.some((role) => user?.roles?.includes(role)),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [user, isBootstrapping, login, logout, hasPermission, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
