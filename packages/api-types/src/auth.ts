export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface RegisterResponse {
  user: User
  tokens: AuthTokens
}
