
import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import {
  auditLogQuerySchema,
  auditLogIdParamSchema,
} from '../schemas/auditLogSchema.ts';

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

// Daftar audit log, hanya admin
auditLogRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(auditLogQuerySchema, 'query'),
  (req, res) => {
    // #swagger.tags = ['Audit Logs']
    // #swagger.summary = 'Daftar audit log'
    // #swagger.security = [{ "bearerAuth": [] }]

    // Parameter pencarian
    // #swagger.parameters['page'] = { in: 'query', type: 'integer', required: false, description: 'Nomor halaman (default 1)' }
    // #swagger.parameters['pageSize'] = { in: 'query', type: 'integer', required: false, description: 'Jumlah data per halaman (default 20, maksimal 100)' }
    // #swagger.parameters['action'] = { in: 'query', type: 'string', required: false, description: 'Filter berdasarkan action, contoh LOGIN' }
    // #swagger.parameters['targetTable'] = { in: 'query', type: 'string', required: false, description: 'Filter berdasarkan nama tabel' }
    // #swagger.parameters['targetId'] = { in: 'query', type: 'integer', required: false, description: 'Filter berdasarkan ID target' }
    // #swagger.parameters['userId'] = { in: 'query', type: 'integer', required: false, description: 'Filter berdasarkan ID pengguna' }
    // #swagger.parameters['from'] = { in: 'query', type: 'string', required: false, description: 'Tanggal awal YYYY-MM-DD' }
    // #swagger.parameters['to'] = { in: 'query', type: 'string', required: false, description: 'Tanggal akhir YYYY-MM-DD' }

    // Dokumentasi response
    // #swagger.responses[200] = { description: 'Daftar audit log berhasil ditampilkan' }
    // #swagger.responses[400] = { description: 'Validasi parameter gagal' }
    // #swagger.responses[401] = { description: 'Token autentikasi tidak ditemukan atau tidak valid' }
    // #swagger.responses[403] = { description: 'Akses ditolak, hanya Admin yang diperbolehkan' }

    return auditLogController.getAuditLogs(req, res);
  },
);

// Detail audit log berdasarkan ID, hanya admin
auditLogRouter.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(auditLogIdParamSchema, 'params'),
  (req, res) => {
    // #swagger.tags = ['Audit Logs']
    // #swagger.summary = 'Detail audit log berdasarkan ID'
    // #swagger.security = [{ "bearerAuth": [] }]

    // Dokumentasi response
    // #swagger.responses[200] = { description: 'Detail audit log berhasil ditampilkan' }
    // #swagger.responses[400] = { description: 'ID tidak valid' }
    // #swagger.responses[401] = { description: 'Token autentikasi tidak ditemukan atau tidak valid' }
    // #swagger.responses[403] = { description: 'Akses ditolak, hanya Admin yang diperbolehkan' }
    // #swagger.responses[404] = { description: 'Audit log tidak ditemukan' }

    return auditLogController.getAuditLogById(req, res);
  },
);

export { auditLogRouter };
