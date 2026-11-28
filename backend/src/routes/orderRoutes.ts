
import { Router } from 'express';
import { OrderController } from '../controllers/orderController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const orderRouter = Router();
const orderController = new OrderController();

// POST membuat pesanan (customer)
orderRouter.post(
  '/',
  authenticate,
  authorize('customer'),
  (req, res) => {
    // #swagger.tags = ['Orders']
    // #swagger.summary = 'Membuat pesanan baru'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/CreateOrderInput' } }
    // #swagger.responses[201] = { description: 'Pesanan berhasil dibuat' }
    // #swagger.responses[400] = { description: 'Data pesanan tidak valid' }
    // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
    // #swagger.responses[403] = { description: 'Role tidak memiliki akses' }
    return orderController.createOrder(req, res);
  },
);

// GET detail pesanan (customer pemilik pesanan dan admin)
orderRouter.get(
  '/:id',
  authenticate,
  authorize('customer', 'admin'),
  (req, res) => {
    // #swagger.tags = ['Orders']
    // #swagger.summary = 'Melihat detail pesanan'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Detail pesanan beserta item' }
    // #swagger.responses[400] = { description: 'ID pesanan tidak valid' }
    // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
    // #swagger.responses[403] = { description: 'Tidak memiliki akses ke pesanan ini' }
    // #swagger.responses[404] = { description: 'Pesanan tidak ditemukan' }
    return orderController.getOrderById(req, res);
  },
);

export { orderRouter };
