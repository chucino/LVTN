import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

@Module({
  imports: [
    // Quản lý biến môi trường toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Giới hạn tần suất request (chống brute force OTP và login)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 20),
        },
      ],
      inject: [ConfigService],
    }),

    // JWT Module toàn cục phục vụ JwtAuthGuard và các module
    JwtModule.register({
      global: true,
    }),

    // Module cơ sở dữ liệu MongoDB
    DatabaseModule,

    // Các module nghiệp vụ
    UsersModule,
    MailModule,
    AuthModule,
  ],
  providers: [
    // Guard JWT mặc định toàn cục cho toàn bộ hệ thống (dùng @Public() để mở)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Guard Throttler toàn cục
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Exception filter tập trung
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Interceptor chuẩn hóa format response
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
