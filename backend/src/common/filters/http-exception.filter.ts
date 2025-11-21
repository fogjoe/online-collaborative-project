import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, // 👈 1. 引入 Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // 创建一个 Logger 实例
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 👇👇👇 2. 关键步骤：把错误打印到终端！ 👇👇👇
    // 如果是 500 错误，打印详细堆栈；如果是普通 400 错误，只打印消息
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
      if (exception instanceof Error) {
        console.error(exception.stack); // 打印完整的堆栈信息
      }
    } else {
      this.logger.warn(`Request Error: ${request.url}`);
    }
    // 👆👆👆 添加结束 👆👆👆

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ||
            (exceptionResponse as any).error;

      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    }

    response.status(status).json({
      code: status,
      message: message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
