import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardGateway } from './board.gateway';
import { WebsocketService } from './websocket.service';
import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Project]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRES_IN'),
        },
      }),
    }),
    forwardRef(() => UserModule),
  ],
  providers: [BoardGateway, WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}
