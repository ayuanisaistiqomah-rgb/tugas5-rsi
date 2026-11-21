
import {
  AuditLogRepository,
  type AuditLogFilter,
} from '../repositories/auditLogRepository.ts';
import type { NodeMsSqlTransaction } from 'drizzle-orm/node-mssql';

export interface CreateAuditLogBody {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  result: string;
}

export class AuditLogService {
  private auditLogRepository: AuditLogRepository;

  constructor(
    auditLogRepository: AuditLogRepository = new AuditLogRepository(),
  ) {
    this.auditLogRepository = auditLogRepository;
  }

  async getAllAuditLogs(filter: AuditLogFilter) {
    return this.auditLogRepository.findAll(filter);
  }

  async getAuditLogById(id: number) {
    return this.auditLogRepository.findById(id);
  }

  async createAuditLog(
    body: CreateAuditLogBody,
    tx?: NodeMsSqlTransaction<any, any>,
  ) {
    let metadata: string | null = null;

    if (body.metadata !== undefined && body.metadata !== null) {
      metadata =
        typeof body.metadata === 'string'
          ? body.metadata
          : JSON.stringify(body.metadata);
    }

    const row = await this.auditLogRepository.create(
      {
      userId: body.userId,
      action: body.action.trim().toUpperCase(),
      targetTable: body.targetTable,
      targetId: body.targetId,
      metadata,
      ipAddress: body.ipAddress,
      userAgent: body.userAgent,
      result: body.result,
    },
    tx,
  );

    if (!row) throw new Error('AUDIT_NOT_FOUND');

    return this.auditLogRepository.findById(row.id, tx);
  }
}
