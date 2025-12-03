import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseMessageKey } from '../decorators/response-message.decorator';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const decoratorMessage = this.reflector.get<string>(
      ResponseMessageKey,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // 1. Check if the Service returned an object with a manual 'message'
        // We look for: { message: "...", result: ... }
        let finalMessage = decoratorMessage || 'Request successfully';
        let finalData = data;

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'result' in data
        ) {
          finalMessage = data.message; // Override with dynamic message
          finalData = data.result; // Extract the actual data
        }

        return {
          code: 200,
          message: finalMessage,
          data: finalData,
        };
      }),
    );
  }
}
