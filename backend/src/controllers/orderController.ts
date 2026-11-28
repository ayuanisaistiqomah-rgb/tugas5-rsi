
import type { Request, Response } from 'express';
import { OrderService } from '../services/orderService.ts';
import { getUser } from '../middlewares/auth.ts';
import { AppError } from '../errors/AppError.ts';

function validateOrderBody(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) {
    return ['Body harus berupa JSON object'];
  }

  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  if (
    typeof b.customerName !== 'string' ||
    b.customerName.trim().length < 2 ||
    b.customerName.length > 80
  ) {
    errors.push('customerName wajib berupa teks 2 sampai 80 karakter');
  }

  if (
    typeof b.phone !== 'string' ||
    b.phone.trim().length < 8 ||
    b.phone.length > 20
  ) {
    errors.push('phone wajib berupa teks 8 sampai 20 karakter');
  }

  if (
    !['transfer', 'qris', 'cash'].includes(b.paymentMethod as string)
  ) {
    errors.push('paymentMethod harus transfer, qris, atau cash');
  }

  if (
    b.note !== undefined &&
    b.note !== null &&
    (typeof b.note !== 'string' || b.note.length > 200)
  ) {
    errors.push('note maksimal 200 karakter');
  }

  if (!Array.isArray(b.items) || b.items.length === 0) {
    errors.push('items wajib berupa array dan minimal berisi satu menu');
  } else {
    b.items.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`items[${index}] harus berupa object`);
        return;
      }

      const menu = item as Record<string, unknown>;

      if (
        !Number.isInteger(menu.menuId) ||
        (menu.menuId as number) <= 0
      ) {
        errors.push(`items[${index}].menuId harus bilangan bulat lebih dari 0`);
      }

      if (
        !Number.isInteger(menu.quantity) ||
        (menu.quantity as number) < 1 ||
        (menu.quantity as number) > 20
      ) {
        errors.push(`items[${index}].quantity harus antara 1 sampai 20`);
      }
    });
  }

  return errors;
}

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export class OrderController {
  private orderService: OrderService;

  constructor(orderService: OrderService = new OrderService()) {
    this.orderService = orderService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'fail',
        message: error.message,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  private badRequest(res: Response, errors: string[]): Response {
    return res.status(400).json({
      status: 'fail',
      message: 'Validasi gagal',
      errors,
    });
  }

  createOrder = async (req: Request, res: Response): Promise<Response> => {
    try {
      const errors = validateOrderBody(req.body);

      if (errors.length > 0) {
        return this.badRequest(res, errors);
      }

      const data = await this.orderService.createOrder(
        req.body,
        getUser(req),
        {
          ipAddress: req.ip ?? null,
          userAgent: req.get('user-agent') ?? null,
        },
      );

      return res.status(201).json({
        status: 'success',
        message: 'Pesanan berhasil dibuat',
        data,
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getOrderById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);

      if (id === null) {
        return this.badRequest(res, [
          'id harus bilangan bulat lebih dari 0',
        ]);
      }

      const data = await this.orderService.getOrderById(
        id,
        getUser(req),
      );

      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
