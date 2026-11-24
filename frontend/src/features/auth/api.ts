import { api } from '../../services/apiClient'
import { tokenStore } from '../../services/tokenStore'
import type { ApiResponse } from '../../types/api'
import type {
  AuthUser,
  LoginResponse,
  RegistrationResponse,
  UserMeResponse,
  VerifyEmailResponse,
} from '../../types/auth'

export interface RegisterOrganizationPayload {
  account: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    acceptTerms: boolean
  }
  organization: {
    name: string
    companyEmail: string
    industry: string
    companySize: string
    country: string
    timezone: string
    website?: string
    phone?: string
  }
  setup?: {
    departments?: string[]
    locations?: string[]
    workingDays?: string[]
    workStartTime?: string
    workEndTime?: string
  }
}

export async function registerOrganization(
  payload: RegisterOrganizationPayload,
): Promise<RegistrationResponse> {
  const response = await api.post<ApiResponse<RegistrationResponse> | RegistrationResponse>(
    '/auth/register/organization',
    payload,
    { skipAuth: true },
  )
  if ('data' in response && response.data) {
    return response.data
  }
  return response as RegistrationResponse
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await api.post<ApiResponse<VerifyEmailResponse> | VerifyEmailResponse>(
    '/auth/verify-email',
    { token },
    { skipAuth: true },
  )
  if ('data' in response && response.data) {
    return response.data
  }
  return response as VerifyEmailResponse
}

export async function resendVerification(
  email: string,
): Promise<{ message: string; developmentVerificationToken?: string }> {
  const response = await api.post<
    ApiResponse<{ message: string; developmentVerificationToken?: string }> | {
      message: string
      developmentVerificationToken?: string
    }
  >('/auth/resend-verification', { email }, { skipAuth: true })
  if ('data' in response && response.data) {
    return response.data
  }
  return response as { message: string; developmentVerificationToken?: string }
}

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
