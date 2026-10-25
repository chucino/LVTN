import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const clientOrigin = configService.get<string>(
    'CLIENT_ORIGIN',
    'http://localhost:5173',
  );

  // Bảo vệ HTTP Header với Helmet
  app.use(helmet());

  // Đọc cookie từ request (cho refresh token HttpOnly)
  app.use(cookieParser());

  // Cấu hình CORS chặt chẽ cho Client với credentials (cookie)
  app.enableCors({
    origin: clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
