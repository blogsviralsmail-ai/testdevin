import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  SUPER_ADMIN = 1,
  VENDOR_ADMIN = 2,
  VENDOR_USER = 3,
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Access denied');

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
