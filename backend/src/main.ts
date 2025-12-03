import { NestFactory } from '@nestjs/core';
import { types } from 'pg';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// 1700 is the OID for NUMERIC/DECIMAL in Postgres
types.setTypeParser(1700, (val) => parseFloat(val));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe());

  // Enable global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();
  await app.listen(process.env.PORT ?? 7000);
}
bootstrap();
