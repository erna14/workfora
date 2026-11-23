import { api } from '../../services/apiClient'
import { tokenStore } from '../../services/tokenStore'
import type { ApiResponse } from '../../types/api'
import type { AuthUser, LoginResponse, UserMeResponse } from '../../types/auth'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse> | LoginResponse>(
    '/auth/login',
    { email, password },
    { skipAuth: true },
  )
  const data = 'data' in response && response.data ? response.data : (response as LoginResponse)
  tokenStore.set(data.accessToken)
  return data
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    tokenStore.clear()
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await api.get<ApiResponse<UserMeResponse> | UserMeResponse>('/auth/me')
  if ('data' in response && response.data) {
    return response.data
  }
  return response as UserMeResponse
}

export async function refreshSession(): Promise<LoginResponse | null> {
  try {
    const response = await api.post<ApiResponse<LoginResponse> | LoginResponse>(
      '/auth/refresh',
      undefined,
      { skipAuth: true, skipRefresh: true },
    )
    const data = 'data' in response && response.data ? response.data : (response as LoginResponse)
    if (data.accessToken) {
      tokenStore.set(data.accessToken)
      return data
    }
    return null
  } catch {
    tokenStore.clear()
    return null
  }
}
