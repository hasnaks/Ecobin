import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { AppModule } from './app.module';
import { DATABASE_URL, DB_PATH } from './config';
import { metricsMiddleware } from './metrics';

async function bootstrap() {
  if (!DATABASE_URL) mkdirSync(dirname(DB_PATH), { recursive: true });
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(metricsMiddleware);
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Database: ${DATABASE_URL ? 'PostgreSQL (DATABASE_URL)' : 'SQLite (local file fallback)'}`);
  console.log(`EcoBin API running on http://localhost:${port}/graphql`);
}
bootstrap();
