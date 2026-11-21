
import { StallRepository, type FindAllParams } from '../repositories/stallRepository.ts';
import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import type { MenuItemDto, StallResponseDto } from '../dtos/stallDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import type { AuthUser } from './tokenService.ts';
import type { CreateStallInput, UpdateStallInput } from '../schemas/stallSchema.ts';
import type { NodeMsSqlTransaction } from 'drizzle-orm/node-mssql';
import { getDb } from '../db/index.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;

interface AuditRequestInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

export class StallService {
  private stallRepository: StallRepository;
  private menuItemRepository: MenuItemRepository;
  private auditLogService: AuditLogService;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.stallRepository = stallRepository;
    this.menuItemRepository = menuItemRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: StallRow): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    return this.menuItemRepository.findByStallId(id);
  }

  async createStall(
    input: CreateStallInput,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<StallResponseDto> {
    const db = await getDb();

    return db.transaction(async (tx) => {
      const row = await this.stallRepository.create(
        { ...input, ownerId: user.id },
        tx,
      );

      if (!row) throw new NotFoundError('Warung gagal dibuat');

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'CREATE_STALL',
        targetTable: 'STALLS',
        targetId: row.id,
        metadata: { name: row.name, role: user.role },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      return this.toDto(row);
    });
  }

  async updateStall(
    id: number,
    input: UpdateStallInput,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<StallResponseDto> {
    const db = await getDb();

    return db.transaction(async (tx) => {
      const current = await this.stallRepository.findById(id, tx);
      if (!current) throw new NotFoundError('Warung tidak ditemukan');

      if (user.role !== 'admin' && current.ownerId !== user.id) {
        throw new ForbiddenError('Kamu hanya bisa mengubah warung milikmu sendiri');
      }

      const row = await this.stallRepository.update(id, input, tx);
      if (!row) throw new NotFoundError('Warung tidak ditemukan');

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'UPDATE_STALL',
        targetTable: 'STALLS',
        targetId: row.id,
        metadata: { name: row.name, role: user.role },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      return this.toDto(row);
    });
  }

  async deleteStall(
    id: number,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<StallResponseDto> {
    const db = await getDb();

    return db.transaction(async (tx) => {
      const current = await this.stallRepository.findById(id, tx);
      if (!current) throw new NotFoundError('Warung tidak ditemukan');

      if (user.role !== 'admin' && current.ownerId !== user.id) {
        throw new ForbiddenError('Kamu hanya bisa menghapus warung milikmu sendiri');
      }

      const row = await this.stallRepository.remove(id, tx);
      if (!row) throw new NotFoundError('Warung tidak ditemukan');

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'DELETE_STALL',
        targetTable: 'STALLS',
        targetId: row.id,
        metadata: { name: row.name, role: user.role },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      return this.toDto(row);
    });
  }
}
