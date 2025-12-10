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
        // 1. Handle dynamic messages (from previous step)
        let finalMessage = decoratorMessage || 'Request successfully';
        let finalData = data;

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'result' in data
        ) {
          finalMessage = data.message;
          finalData = data.result;
        }

        // 2. ✅ RECURSIVELY FORMAT DATES IN DATA
        const formattedData = this.formatDates(finalData);

        return {
          code: 200,
          message: finalMessage,
          data: formattedData,
        };
      }),
    );
  }

  /**
   * Helper function to recursively traverse objects/arrays
   * and convert ISO date strings to "YYYY-MM-DD HH:mm:ss"
   */
  private formatDates(data: any): any {
    // If Array, loop through items
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data.map((item) => this.formatDates(item));
    }

    // If Object, loop through keys
    if (data !== null && typeof data === 'object') {
      // Check if the object itself is a Date object
      if (data instanceof Date) {
        return this.toSimpleDateString(data);
      }

      // Otherwise iterate properties
      const newData = { ...data }; // Clone to avoid mutation side effects
      for (const key in newData) {
        newData[key] = this.formatDates(newData[key]);
      }
      return newData;
    }

    // If String and looks like an ISO Date, format it
    if (
      typeof data === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)
    ) {
      const date = new Date(data);
      if (!isNaN(date.getTime())) {
        return this.toSimpleDateString(date);
      }
    }

    return data;
  }

  /**
   * Formats a Date object to "YYYY-MM-DD HH:mm:ss"
   */
  private toSimpleDateString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are 0-indexed
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
