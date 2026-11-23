const SESSION_HINT_KEY = 'workfora.session'

let accessToken: string | null = null

function readSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function writeSessionHint(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(SESSION_HINT_KEY, '1')
    } else {
      localStorage.removeItem(SESSION_HINT_KEY)
    }
  } catch {
    // ignore storage failures
  }
}

export const tokenStore = {
  get(): string | null {
    return accessToken
  },
  set(token: string | null): void {
    accessToken = token
    if (token) {
      writeSessionHint(true)
    }
  },
  clear(): void {
    accessToken = null
    writeSessionHint(false)
  },
  /** True when we previously signed in and may still have a refresh cookie. */
  hasSessionHint(): boolean {
    return readSessionHint()
  },
}
