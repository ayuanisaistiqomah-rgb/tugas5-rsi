
import type { Request, Response } from 'express';
import { AuditLogService } from '../services/auditLogService.ts';
import { getValidated } from '../middlewares/validate.ts';
import {
  type AuditLogQuery,
  type AuditLogIdParam,
} from '../schemas/auditLogSchema.ts';
import { AppError } from '../errors/AppError.ts';

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor(auditLogService: AuditLogService = new AuditLogService()) {
    this.auditLogService = auditLogService;
  }

  getAuditLogs = async (req: Request, res: Response): Promise<Response> => {
    const filter = getValidated<AuditLogQuery>(res, 'query');

    const result = await this.auditLogService.getAllAuditLogs(filter);

    const totalPages = Math.ceil(result.total / filter.pageSize);

    return res.status(200).json({
      status: 'success',
      data: {
        items: result.items,
        pagination: {
          page: filter.page,
          pageSize: filter.pageSize,
          total: result.total,
          totalPages,
        },
      },
    });
  };

  getAuditLogById = async (req: Request, res: Response): Promise<Response> => {
    const params = getValidated<AuditLogIdParam>(res, 'params');

    const data = await this.auditLogService.getAuditLogById(params.id);

    if (!data) {
      throw new AppError(404, 'Audit log tidak ditemukan');
    }

    return res.status(200).json({
      status: 'success',
      data,
    });
  };
}
