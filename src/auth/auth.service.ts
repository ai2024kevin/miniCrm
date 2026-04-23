import { Injectable, UnauthorizedException } from '@nestjs/common';
import { resolveCrmAuthToken } from './bearer-token.guard';

@Injectable()
export class AuthService {
  async login(login: string, password: string): Promise<{ ok: true; token: string }> {
    const expectedLogin = process.env.CRM_LOGIN ?? 'admin';
    const expectedPassword = process.env.CRM_PASSWORD ?? 'admin123';

    if (login !== expectedLogin || password !== expectedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { ok: true, token: resolveCrmAuthToken() };
  }
}
