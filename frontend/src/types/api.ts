export interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
}

export interface PageResponse<T> {
  data: T[]
  meta: PageMeta
}

export interface PageParams {
  page?: number
  size?: number
  sort?: string
  search?: string
}

export interface ApiErrorBody {
  title?: string
  detail?: string
  status?: number
  type?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly title?: string
  readonly body?: ApiErrorBody

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = body?.title
    this.body = body
  }
}
