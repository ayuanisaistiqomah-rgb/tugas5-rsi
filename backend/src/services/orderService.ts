
import { OrderRepository } from '../repositories/orderRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { AppError } from '../errors/AppError.ts';
import type { AuthUser } from './tokenService.ts';
import type { CreateOrderInput } from '../dtos/orderDto.ts';
import { getDb } from '../db/index.ts';

interface AuditRequestInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

export class OrderService {
  private orderRepository: OrderRepository;
  private auditLogService: AuditLogService;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.orderRepository = orderRepository;
    this.auditLogService = auditLogService;
  }

  async createOrder(
    input: CreateOrderInput,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ) {
    if (user.role !== 'customer') {
      throw new ForbiddenError('Hanya Customer yang bisa membuat pesanan');
    }

    if (!input.items || input.items.length === 0) {
      throw new AppError(400, 'Pesanan harus memiliki minimal satu menu');
    }

    const menuIds = input.items.map((item) => item.menuId);

    if (new Set(menuIds).size !== menuIds.length) {
      throw new AppError(400, 'Menu yang sama tidak boleh dimasukkan dua kali');
    }

    for (const item of input.items) {
      if (!Number.isInteger(item.menuId) || item.menuId <= 0) {
        throw new AppError(400, 'ID menu tidak valid');
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {
        throw new AppError(400, 'Jumlah menu harus antara 1 sampai 20');
      }
    }

    const db = await getDb();

    return db.transaction(async (tx) => {
      const menus = await this.orderRepository.findMenusByIds(menuIds, tx);

      if (menus.length !== menuIds.length) {
        throw new NotFoundError('Salah satu menu tidak ditemukan');
      }

      const orderItems = input.items.map((item) => {
        const menu = menus.find((row) => row.id === item.menuId);

        if (!menu) {
          throw new NotFoundError('Menu tidak ditemukan');
        }

        if (!menu.isAvailable) {
          throw new AppError(400, `Menu ${menu.name} sedang tidak tersedia`);
        }

        return {
          orderId: 0,
          menuId: menu.id,
          stallId: menu.stallId,
          stallName: menu.stallName,
          menuName: menu.name,
          unitPrice: menu.price,
          quantity: item.quantity,
          subtotal: menu.price * item.quantity,
        };
      });

      const total = orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      const orderCode = `ORD-${Date.now()}-${user.id}`;

      const order = await this.orderRepository.createOrder({
        orderCode,
        customerId: user.id,
        customerName: input.customerName,
        phone: input.phone,
        paymentMethod: input.paymentMethod,
        note: input.note,
        total,
        status: 'confirmed',
      }, tx);

      if (!order) {
        throw new AppError(500, 'Pesanan gagal dibuat');
      }

      await this.orderRepository.createOrderItems(
        orderItems.map((item) => ({
          ...item,
          orderId: order.id,
        })),
        tx,
      );

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'CREATE_ORDER',
        targetTable: 'ORDERS',
        targetId: order.id,
        metadata: {
          orderCode: order.orderCode,
          total: order.total,
          itemCount: orderItems.length,
          paymentMethod: order.paymentMethod,
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      const savedItems = await this.orderRepository.findOrderItems(
        order.id,
        tx,
      );

      return {
        ...order,
        items: savedItems,
      };
    });
  }

  async getOrderById(id: number, user: AuthUser) {
    const order = await this.orderRepository.findOrderById(id);

    if (!order) {
      throw new NotFoundError('Pesanan tidak ditemukan');
    }

    if (user.role !== 'admin' && order.customerId !== user.id) {
      throw new ForbiddenError(
        'Kamu tidak bisa melihat pesanan milik pengguna lain',
      );
    }

    const items = await this.orderRepository.findOrderItems(id);

    return {
      ...order,
      items,
    };
  }
}
