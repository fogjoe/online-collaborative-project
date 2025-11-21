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
      // 1. 告诉它去哪里找 Token (Authorization Header: Bearer ...)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. 是否忽略过期时间 (否，过期了就报错)
      ignoreExpiration: false,
      // 3. 告诉它解密用的密钥 (必须和签发时的一样！)
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // 4. 验证通过后，NestJS 会自动调用这个 validate 函数
  async validate(payload: { sub: number; email: string }) {
    // payload 是 Token 解密后的 JSON 数据
    const user = await this.userService.findOneByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException();
    }
    // 删除密码哈希，不让它在系统里流转
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    // 返回值会被 NestJS 自动放入 request.user 中
    return result;
  }
}
