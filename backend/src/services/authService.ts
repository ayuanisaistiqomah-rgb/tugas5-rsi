
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import { signToken } from './tokenService.ts';
import { AppError } from '../errors/AppError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import type { AuthUser } from './tokenService.ts'; 
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import type { AuthUserDto, LoginResponseDto } from '../dtos/authDto.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findAuthByEmail']>>>;

export interface AuditRequestInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

function getSaltRounds(): number {
  return Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
}

export class AuthService {
  private userRepository: UserRepository;
  private auditLogService: AuditLogService;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.userRepository = userRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: UserRow): AuthUserDto {
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async register(input: RegisterInput): Promise<AuthUserDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new AppError(409, 'Email sudah terdaftar');

    const passwordHash = await bcrypt.hash(input.password, getSaltRounds());

    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'customer',
    });

    if (!row) throw new AppError(500, 'User gagal dibuat');

    return this.toDto(row);
  }

  async login(
    input: LoginInput,
    requestInfo: AuditRequestInfo,
  ): Promise<LoginResponseDto> {
    const row = await this.userRepository.findAuthByEmail(input.email);

    if (!row) throw new UnauthorizedError('Email atau password salah');

    const passwordValid = await bcrypt.compare(input.password, row.passwordHash);
    if (!passwordValid) throw new UnauthorizedError('Email atau password salah');

    const user = this.toDto(row);

    // Audit login bersifat best-effort: kegagalan audit tidak menggagalkan login.
    try {
      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        targetTable: 'USERS',
        targetId: user.id,
        metadata: { role: user.role },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      });
    } catch (error) {
      console.error('Gagal menyimpan audit LOGIN:', error);
    }

    return {
      token: signToken(user),
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
      user,
    };
  }

  async logout(
    user: AuthUser,
    requestInfo: AuditRequestInfo,
  ): Promise<void> {
    // Audit logout bersifat best-effort.
    // Kegagalan pencatatan tidak boleh menggagalkan logout.
    try {
      await this.auditLogService.createAuditLog({
        userId: user.id,
        action: 'LOGOUT',
        targetTable: 'USERS',
        targetId: user.id,
        metadata: { role: user.role },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        result: 'success',
      });
    } catch (error) {
      console.error('Gagal menyimpan audit LOGOUT:', error);
    }
  }
}