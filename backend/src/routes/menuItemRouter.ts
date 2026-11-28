
import { Router } from 'express';
import { MenuItemController } from '../controllers/menuItemController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const menuItemRouter = Router();
const menuItemController = new MenuItemController();

// GET semua menu (public)
menuItemRouter.get('/', (req, res) => {
  // #swagger.tags = ['Menu Items']
  // #swagger.summary = 'Daftar menu + nama warung (JOIN)'
  // #swagger.parameters['stallId'] = { in: 'query', type: 'integer', description: 'Filter berdasarkan ID warung' }
  // #swagger.responses[200] = { description: 'Daftar menu beserta data warung' }
  // #swagger.responses[400] = { description: 'Query tidak valid' }
  return menuItemController.getMenuItems(req, res);
});

// POST tambah menu (owner dan admin)
menuItemRouter.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  (req, res) => {
    // #swagger.tags = ['Menu Items']
    // #swagger.summary = 'Tambah menu'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemInput' } }
    // #swagger.responses[201] = { description: 'Menu dibuat' }
    // #swagger.responses[400] = { description: 'Body tidak valid' }
    // #swagger.responses[404] = { description: 'Warung tidak ditemukan' }
    // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
    // #swagger.responses[403] = { description: 'Role tidak memiliki akses' }
    return menuItemController.createMenuItem(req, res);
  },
);

// GET detail menu (public)
menuItemRouter.get('/:id', (req, res) => {
  // #swagger.tags = ['Menu Items']
  // #swagger.summary = 'Detail menu + nama warung (JOIN)'
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail menu' }
  // #swagger.responses[404] = { description: 'Menu tidak ditemukan' }
  return menuItemController.getMenuItemById(req, res);
});

// PUT ubah menu (owner dan admin)
menuItemRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  (req, res) => {
    // #swagger.tags = ['Menu Items']
    // #swagger.summary = 'Update menu (boleh sebagian)'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemUpdate' } }
    // #swagger.responses[200] = { description: 'Menu ter-update' }
    // #swagger.responses[400] = { description: 'Body/parameter tidak valid' }
    // #swagger.responses[404] = { description: 'Menu atau warung tidak ditemukan' }
    // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
    // #swagger.responses[403] = { description: 'Role tidak memiliki akses' }
    return menuItemController.updateMenuItem(req, res);
  },
);

// DELETE hapus menu (admin)
menuItemRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  (req, res) => {
    // #swagger.tags = ['Menu Items']
    // #swagger.summary = 'Hapus menu'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    // #swagger.responses[200] = { description: 'Menu terhapus' }
    // #swagger.responses[404] = { description: 'Menu tidak ditemukan' }
    // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
    // #swagger.responses[403] = { description: 'Role tidak memiliki akses' }
    return menuItemController.deleteMenuItem(req, res);
  },
);

export { menuItemRouter };
