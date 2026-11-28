export type UserRole = 'admin' | 'owner' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface LoginResult {
  token: string
  tokenType: 'Bearer'
  expiresIn: string
  user: User
}

export interface Stall {
  id: number
  ownerId: number
  name: string
  category: string | null
  location: string | null
  description: string | null
  avgRating: number
  reviewCount: number
  isPopular: boolean
}

export interface MenuItem {
  id: number
  stallId: number
  stallName: string
  stallLocation: string | null
  name: string
  price: number
  isAvailable: boolean
}

export interface MenuItemPayload {
  stallId: number
  name: string
  price: number
  isAvailable: boolean
}
export interface StallInput {
  name: string
  category: string
  location: string
  description: string
}

// bentuk yang dikirim ke backend (field kosong dikirim sebagai null)
export interface StallPayload {
  name: string
  category: string | null
  location: string | null
  description: string | null
}

export interface StallQuery {
  search?: string
  category?: string
  page?: number
  limit?: number
}

export interface PageMeta {
  page: number
  limit: number
  total: number
}

export interface StallListResult {
  data: Stall[]
  meta: PageMeta
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface ApiResponse<T> {
  status: string
  data: T
}

export interface FieldIssue {
  field: string
  message: string
}

export interface AuditLog {
  id: number
  userId: number
  userName: string | null
  userEmail: string | null
  action: string
  targetTable: string
  targetId: number
  metadata: string | null
  createdAt: string
  ipAddress: string | null
  userAgent: string | null
  result: string | null
}

export interface AuditLogQuery {
  page?: number
  pageSize?: number
  action?: string
  targetTable?: string
  targetId?: number
  userId?: number
  from?: string
  to?: string
}

export interface AuditLogPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AuditLogListResult {
  items: AuditLog[]
  pagination: AuditLogPagination
}


export interface CreateOrderItemInput {
  menuId: number
  quantity: number
}

export interface CreateOrderInput {
  customerName: string
  phone: string
  paymentMethod: 'transfer' | 'qris' | 'cash'
  note?: string
  items: CreateOrderItemInput[]
}

export interface OrderItem {
  id: number
  menuId: number | null
  stallId: number | null
  stallName: string | null
  menuName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: number
  orderCode: string
  customerId: number
  customerName: string
  phone: string
  paymentMethod: string
  note: string | null
  total: number
  status: string
  createdAt: string
  items: OrderItem[]
}
