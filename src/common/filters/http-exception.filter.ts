import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Đã xảy ra lỗi nội bộ hệ thống';
    const responseDetails: Record<string, unknown> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const responseObject = exceptionResponse as Record<string, unknown>;
      const responseMessage = responseObject.message;
      if (typeof responseMessage === 'string') {
        message = responseMessage;
      } else if (
        Array.isArray(responseMessage) &&
        responseMessage.every((item): item is string => typeof item === 'string')
      ) {
        message = responseMessage;
      }
      for (const key of ['issues', 'warnings', 'readiness']) {
        if (key in exceptionResponse) {
          responseDetails[key] = responseObject[key];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Error: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`,
      );
    }

    response.status(status).json({
      ...responseDetails,
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
