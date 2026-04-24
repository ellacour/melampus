export interface PaginatedResponse<T> {
  pagination: {
    count: number
    next: string | null
    previous: string | null
    page: number
    total_pages: number
  }
  results: T[]
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}
