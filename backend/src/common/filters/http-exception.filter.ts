import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取状态码
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取错误信息
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      // NestJS 的错误响应可能是字符串也可能是对象
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ||
            (exceptionResponse as any).error;

      // 如果 message 是数组（例如 class-validator 的错误），将其转为字符串
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    }

    // 返回统一的 JSON 格式
    response.status(status).json({
      code: status, // 使用 code 替代 statusCode
      message: message,
      data: null, // 错误时 data 为 null
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
