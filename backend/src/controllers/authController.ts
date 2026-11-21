import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';

/**
 * Tanpa try/catch: Express 5 otomatis meneruskan error dari handler async
 * ke errorHandler, jadi format error-nya selalu sama.
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  register = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<RegisterInput>(res, 'body');
    const user = await this.authService.register(body);
    res.status(201).json({ status: 'success', data: { user } });
  };

login = async (req: Request, res: Response): Promise<void> => {
  const body = getValidated<LoginInput>(res, 'body');

  const data = await this.authService.login(body, {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(200).json({ status: 'success', data });
};

  logout = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);

    // Audit logout bersifat best-effort.
    try {
      await this.authService.logout(user, {
        ipAddress: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      });
    } catch (error) {
      console.error('Gagal menyimpan audit LOGOUT:', error);
    }

    res.status(200).json({
      status: 'success',
      message: 'Logout berhasil',
    });
  };

  // Membalas isi token. Identitas user diambil dari token, bukan dari body.
  getMe = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    res.status(200).json({ status: 'success', data: user });
  };
}