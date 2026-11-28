export interface CreateOrderItemInput {
  menuId: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  paymentMethod: 'transfer' | 'qris' | 'cash';
  note?: string;
  items: CreateOrderItemInput[];
}

export interface OrderItemDto {
  id: number;
  menuId: number | null;
  stallId: number | null;
  stallName: string | null;
  menuName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDto {
  id: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  phone: string;
  paymentMethod: string;
  note: string | null;
  total: number;
  status: string;
  createdAt: Date;
  items: OrderItemDto[];
}