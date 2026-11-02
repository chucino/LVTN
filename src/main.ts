import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module.js';

const DEV_LOCALHOST_ORIGIN_REGEX = /^http:\/\/(?:localhost|127\.0\.0\.1):\d{2,5}$/;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const rawClientOrigin = configService.get<string>(
    'CLIENT_ORIGIN',
    'http://localhost:5173,http://localhost:5174',
  );
  const configuredOrigins = new Set(
    rawClientOrigin
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

  // Bảo vệ HTTP Header với Helmet (cho phép tải tài nguyên tĩnh cross-origin)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Phục vụ tài nguyên tĩnh (ảnh, video và file) từ thư mục public/
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  // Đọc cookie từ request (cho refresh token HttpOnly)
  app.use(cookieParser());

  // Cấu hình CORS hỗ trợ nhiều cổng client (5173, 5174, 5175...) với credentials (cookie)
  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      if (
        configuredOrigins.has(requestOrigin) ||
        (nodeEnv !== 'production' && DEV_LOCALHOST_ORIGIN_REGEX.test(requestOrigin))
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${requestOrigin} không được phép bởi CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Port'],
  });

  // Tiền tố API thống nhất: /api/v1
  app.setGlobalPrefix('api/v1');

  // Kiểm tra và validate dữ liệu DTO đầu vào
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cấu hình Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NextCode E-Learning API')
    .setDescription(
      'Hệ thống API RESTful cho nền tảng học lập trình trực tuyến NextCode (Luận văn tốt nghiệp)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token JWT: Bearer {token}',
        in: 'header',
      },
      'bearer',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
      description: 'Cookie chứa refresh token được gửi tự động bởi trình duyệt',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`Server đang chạy tại: http://localhost:${port}/api/v1`);
  logger.log(`Tài liệu Swagger API tại: http://localhost:${port}/api/docs`);
}

await bootstrap();
