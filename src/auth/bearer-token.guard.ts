import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

export const resolveCrmAuthToken = (): string => {
  const token = process.env.CRM_AUTH_TOKEN?.trim();

  if (!token) {
    throw new InternalServerErrorException('CRM_AUTH_TOKEN is not configured');
  }

  return token;
};

@Injectable()
export class BearerTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const rawAuthorization = request.headers?.authorization;
    const authorization = Array.isArray(rawAuthorization) ? rawAuthorization[0] : rawAuthorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must be Bearer token');
    }

    if (token !== resolveCrmAuthToken()) {
      throw new UnauthorizedException('Invalid auth token');
    }

    return true;
  }
}
