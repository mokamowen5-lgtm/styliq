export interface ApiResponse<T> {
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
  details?: Record<string, string[]>
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextCursor?: string
}

export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResponse {
  user: import("./user").User
  tokens: AuthTokens
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  displayName: string
  password: string
  referralCode?: string
}
