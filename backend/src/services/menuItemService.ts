
import {
  MenuItemRepository,
  type CreateMenuItemInput,
} from '../repositories/menuItemRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { MenuItemWithStallDto } from '../dtos/menuItemDto.ts';
import { AuditLogService } from './auditLogService.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import type { AuthUser } from './tokenService.ts';
import type { NodeMsSqlTransaction } from 'drizzle-orm/node-mssql';
import { getDb } from '../db/index.ts';

interface AuditRequestInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

export class MenuItemService {
  private menuItemRepository: MenuItemRepository;
  private stallRepository: StallRepository;
  private auditLogService: AuditLogService;

  constructor(
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    stallRepository: StallRepository = new StallRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.menuItemRepository = menuItemRepository;
    this.stallRepository = stallRepository;
    this.auditLogService = auditLogService;
  }

  private async ensureStallAccess(
    stallId: number,
    user: AuthUser,
    tx?: NodeMsSqlTransaction<any, any>,
  ) {
    const stall = await this.stallRepository.findById(stallId, tx);

    if (!stall) {
      throw new NotFoundError('Warung tidak ditemukan');
    }

    if (user.role !== 'admin' && stall.ownerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa mengelola menu warung milikmu');
    }

    return stall;
  }

  async getAllMenuItems(stallId?: number): Promise<MenuItemWithStallDto[]> {
    return this.menuItemRepository.findAllWithStall(stallId);
  }

  async getMenuItemById(id: number): Promise<MenuItemWithStallDto> {
    const row = await this.menuItemRepository.findByIdWithStall(id);

    if (!row) {
      throw new NotFoundError('Menu tidak ditemukan');
    }

    return row;
  }

  async createMenuItem(
    input: CreateMenuItemInput,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<MenuItemWithStallDto> {
    const db = await getDb();

    return db.transaction(async (tx) => {
      await this.ensureStallAccess(input.stallId, user, tx);

      const row = await this.menuItemRepository.create(input, tx);

      if (!row) {
        throw new NotFoundError('Menu gagal dibuat');
      }

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'CREATE_MENU',
        targetTable: 'MENU_ITEMS',
        targetId: row.id,
        metadata: { name: row.name, stallId: row.stallId },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      const result = await this.menuItemRepository.findByIdWithStall(row.id, tx);

      if (!result) {
        throw new NotFoundError('Menu tidak ditemukan');
      }

      return result;
    });
  }

  async updateMenuItem(
    id: number,
    input: Partial<CreateMenuItemInput>,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<MenuItemWithStallDto> {
    const db = await getDb();

    return db.transaction(async (tx) => {
      const current = await this.menuItemRepository.findByIdWithStall(id, tx);

      if (!current) {
        throw new NotFoundError('Menu tidak ditemukan');
      }

      await this.ensureStallAccess(current.stallId, user, tx);

      if (input.stallId !== undefined) {
        await this.ensureStallAccess(input.stallId, user, tx);
      }

      const row = await this.menuItemRepository.update(id, input, tx);

      if (!row) {
        throw new NotFoundError('Menu tidak ditemukan');
      }

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'UPDATE_MENU',
        targetTable: 'MENU_ITEMS',
        targetId: row.id,
        metadata: {
          name: row.name,
          stallId: row.stallId,
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      const result = await this.menuItemRepository.findByIdWithStall(id, tx);

      if (!result) {
        throw new NotFoundError('Menu tidak ditemukan');
      }

      return result;
    });
  }

  async deleteMenuItem(
    id: number,
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<MenuItemWithStallDto> {
    const db = await getDb();

    return db.transaction(async (tx) => {
      const current = await this.menuItemRepository.findByIdWithStall(id, tx);

      if (!current) {
        throw new NotFoundError('Menu tidak ditemukan');
      }

      await this.ensureStallAccess(current.stallId, user, tx);

      const row = await this.menuItemRepository.remove(id, tx);

      if (!row) {
        throw new NotFoundError('Menu tidak ditemukan');
      }

      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'DELETE_MENU',
        targetTable: 'MENU_ITEMS',
        targetId: row.id,
        metadata: {
          name: current.name,
          stallId: current.stallId,
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      }, tx);

      return current;
    });
  }
}
