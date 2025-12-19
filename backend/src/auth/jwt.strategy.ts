// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    super({
      // 1. Tell it where to find the Token (Authorization Header: Bearer ...)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. Whether to ignore the expiration time (No, an error will be reported if it expires)
      ignoreExpiration: false,
      // 3. Tell it the secret key for decryption (must be the same as when it was issued!)
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // 4. After the validation is passed, NestJS will automatically call this validate function
  async validate(payload: { sub: number; email: string }) {
    // payload is the JSON data after the Token is decrypted
    const user = await this.userService.findOneByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException();
    }
    // Delete the password hash to prevent it from circulating in the system
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    // The return value will be automatically put into request.user by NestJS
    // Inject userId because controllers expect req.user.userId
    return { userId: user.id, ...result };
  }
}

