
import {
  and,
  desc,
  eq,
  gte,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { NodeMsSqlTransaction } from 'drizzle-orm/node-mssql'; 
import { getDb } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';

export interface AuditLogFilter {
  page: number;
  pageSize: number;
  userId?: number;
  targetId?: number;
  action?: string;
  targetTable?: string;
  from?: string;
  to?: string;
}

export interface CreateAuditLogInput {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  result: string;
}

// Kolom hasil JOIN AUDIT_LOGS + USERS.
const auditColumns = {
  id: auditLogs.id,
  userId: auditLogs.userId,
  userName: users.name,
  userEmail: users.email,
  action: auditLogs.action,
  targetTable: auditLogs.targetTable,
  targetId: auditLogs.targetId,
  metadata: auditLogs.metadata,
  createdAt: auditLogs.createdAt,
  ipAddress: auditLogs.ipAddress,
  userAgent: auditLogs.userAgent,
  result: auditLogs.result,
};

export class AuditLogRepository {
  async findAll(filter: AuditLogFilter) {
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filter.userId !== undefined) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }

    if (filter.targetId !== undefined) {
      conditions.push(eq(auditLogs.targetId, filter.targetId));
    }

    if (filter.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }

    if (filter.targetTable) {
      conditions.push(eq(auditLogs.targetTable, filter.targetTable));
    }

    if (filter.from) {
      conditions.push(
        gte(
          auditLogs.createdAt,
          new Date(`${filter.from}T00:00:00.000Z`),
        ),
      );
    }

    if (filter.to) {
      const nextDay = new Date(`${filter.to}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      conditions.push(lt(auditLogs.createdAt, nextDay));
    }

    const where =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Menghitung jumlah data setelah filter diterapkan.
    const countRows = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(where);

    const total = Number(countRows[0]?.total ?? 0);

    // Mengambil data sesuai halaman.
    const items = await db
      .select(auditColumns)
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .offset((filter.page - 1) * filter.pageSize)
      .fetch(filter.pageSize);

    return {
      items,
      total,
    };
  }

async findById(
  id: number,
  tx?: NodeMsSqlTransaction<any, any>,
) {
  const db = tx ?? await getDb();

  const rows = await db
    .select(auditColumns)
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.id, id));

  return rows[0];
}

async create(
  input: CreateAuditLogInput,
  tx?: NodeMsSqlTransaction<any, any>,
) {
  const db = tx ?? await getDb();

  const rows = await db
    .insert(auditLogs)
    .output()
    .values(input);

  return rows[0];
}
}
