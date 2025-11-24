import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, // 👈 1. Import Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Create a Logger instance
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 👇👇👇 2. Key step: Print the error to the terminal! 👇👇👇
    // If it is a 500 error, print the detailed stack; if it is a normal 400 error, only print the message
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
      if (exception instanceof Error) {
        console.error(exception.stack); // Print the complete stack information
      }
    } else {
      this.logger.warn(`Request Error: ${request.url}`);
    }
    // 👆👆👆 End of addition 👆👆👆

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
