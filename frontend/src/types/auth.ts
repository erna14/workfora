export interface AuthUser {
  id: string
  email: string
  employeeId: string | null
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
