
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import {
  orders,
  orderItems,
  menuItems,
  stalls,
} from '../db/schema.ts';
import type { NodeMsSqlTransaction } from 'drizzle-orm/node-mssql';

export class OrderRepository {
  // Mengambil data menu berdasarkan ID yang dipilih Customer.
  async findMenusByIds(
    menuIds: number[],
    tx?: NodeMsSqlTransaction<any, any>,
  ) {
    const db = tx ?? await getDb();

    return db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable,
        stallId: stalls.id,
        stallName: stalls.name,
      })
      .from(menuItems)
      .innerJoin(stalls, eq(menuItems.stallId, stalls.id))
      .where(inArray(menuItems.id, menuIds));
  }

  // Membuat data utama Order.
  async createOrder(
    input: {
      orderCode: string;
      customerId: number;
      customerName: string;
      phone: string;
      paymentMethod: 'transfer' | 'qris' | 'cash';
      note?: string;
      total: number;
      status: 'confirmed' | 'completed' | 'cancelled';
    },
    tx: NodeMsSqlTransaction<any, any>,
  ) {
    await tx
      .insert(orders)
      .values({
        orderCode: input.orderCode,
        customerId: input.customerId,
        customerName: input.customerName,
        phone: input.phone,
        paymentMethod: input.paymentMethod,
        note: input.note ?? null,
        total: input.total,
        status: input.status,
        createdAt: new Date(),
      });

    const rows = await tx
      .select()
      .from(orders)
      .where(eq(orders.orderCode, input.orderCode));

    return rows[0];
  }

  // Menyimpan daftar item dalam Order.
  async createOrderItems(
    items: {
      orderId: number;
      menuId: number;
      stallId: number;
      stallName: string;
      menuName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }[],
    tx: NodeMsSqlTransaction<any, any>,
  ) {
    await tx
      .insert(orderItems)
      .values(items);
  }

  // Mengambil satu Order berdasarkan ID.
  async findOrderById(
    id: number,
    tx?: NodeMsSqlTransaction<any, any>,
  ) {
    const db = tx ?? await getDb();

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    return rows[0];
  }

  // Mengambil semua item dari satu Order.
  async findOrderItems(
    orderId: number,
    tx?: NodeMsSqlTransaction<any, any>,
  ) {
    const db = tx ?? await getDb();

    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }
}
