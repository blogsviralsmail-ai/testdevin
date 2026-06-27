import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class VendorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('Authentication required');
    if (!user.vendorId && user.role !== 1) {
      throw new ForbiddenException('Vendor context required');
    }
    return true;
  }
}
