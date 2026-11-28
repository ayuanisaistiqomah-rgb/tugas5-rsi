
import axios, { type AxiosResponse } from 'axios'
import { http } from './http'
import type {
  AuditLog,
  AuditLogListResult,
  AuditLogQuery,
  ApiResponse,
  FieldIssue,
  LoginInput,
  LoginResult,
  MenuItem,
  MenuItemPayload,
  PageMeta,
  RegisterInput,
  Stall,
  StallPayload,
  StallListResult,
  StallQuery,
  User,
  CreateOrderInput,
  Order,
} from '../types/api'

function data<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data
}

export const authApi = {
  register: (input: RegisterInput) =>
    http.post<ApiResponse<{ user: User }>>('/auth/register', input).then(data),
  login: (input: LoginInput) =>
    http.post<ApiResponse<LoginResult>>('/auth/login', input).then(data),
  me: () => http.get<ApiResponse<User>>('/auth/me').then(data),
  logout: () => http.post<ApiResponse<null>>('/auth/logout'),
}

export const stallApi = {
  list: (params?: StallQuery) =>
    http
      .get<ApiResponse<Stall[]> & { meta: PageMeta }>('/stalls', { params })
      .then((response): StallListResult => ({
        data: response.data.data,
        meta: response.data.meta,
      })),
  detail: (id: number) =>
    http.get<ApiResponse<Stall>>(`/stalls/${id}`).then(data),
  menus: (id: number) =>
    http.get<ApiResponse<MenuItem[]>>(`/stalls/${id}/menus`).then(data),
  create: (input: StallPayload) =>
    http.post<ApiResponse<Stall>>('/stalls', input).then(data),
  update: (id: number, input: StallPayload) =>
    http.put<ApiResponse<Stall>>(`/stalls/${id}`, input).then(data),
  remove: (id: number) =>
    http.delete<ApiResponse<Stall>>(`/stalls/${id}`).then(data),
}

export const menuApi = {
  list: (stallId: number) =>
    http
      .get<ApiResponse<MenuItem[]>>('/menu-items', {
        params: { stallId },
      })
      .then(data),

  create: (input: MenuItemPayload) =>
    http.post<ApiResponse<MenuItem>>('/menu-items', input).then(data),

  update: (id: number, input: Partial<MenuItemPayload>) =>
    http.put<ApiResponse<MenuItem>>(`/menu-items/${id}`, input).then(data),

  remove: (id: number) =>
    http.delete<ApiResponse<MenuItem>>(`/menu-items/${id}`).then(data),
}

export const auditLogApi = {
  list: (params?: AuditLogQuery) =>
    http
      .get<ApiResponse<AuditLogListResult>>('/audit-logs', { params })
      .then(data),

  detail: (id: number) =>
    http.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`).then(data),
}

export const orderApi = {
  create: (input: CreateOrderInput) =>
    http.post<ApiResponse<Order>>('/orders', input).then(data),

  detail: (id: number) =>
    http.get<ApiResponse<Order>>(`/orders/${id}`).then(data),
}

interface ErrorBody {
  message?: string
  errors?: FieldIssue[]
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Tidak bisa terhubung ke server. Pastikan backend sudah jalan.'
    }

    const body = error.response.data as ErrorBody | undefined
    if (body?.message) return body.message

    if (error.response.status === 401) return 'Kamu belum login atau sesi sudah habis.'
    if (error.response.status === 403) return 'Kamu tidak punya izin untuk aksi ini.'
    if (error.response.status === 404) return 'Data tidak ditemukan.'
    return `Terjadi kesalahan (${error.response.status}).`
  }

  return 'Terjadi kesalahan yang tidak terduga.'
}

export function getFieldIssues(error: unknown): FieldIssue[] {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const body = error.response.data as ErrorBody | undefined
    if (Array.isArray(body?.errors)) return body.errors
  }
  return []
}

export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}
