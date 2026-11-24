export interface AuthUser {
  id: string
  email: string
  employeeId: string | null
  organizationId: string | null
  firstName: string | null
  lastName: string | null
  roles: string[]
  permissions: string[]
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export interface UserMeResponse extends AuthUser {}

export interface RegistrationResponse {
  organizationId: string
  organizationSlug: string
  organizationName: string
  userId: string
  email: string
  emailVerificationRequired: boolean
  message: string
  developmentVerificationToken?: string | null
}

export interface VerifyEmailResponse {
  verified: boolean
  email: string
  message: string
}
