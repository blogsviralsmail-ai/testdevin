import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: number;
  email: string;
  role: number;
  vendorId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'wabapanel-jwt-secret'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      vendorId: payload.vendorId,
    };
  }
}
