import { NestFactory } from '@nestjs/core';
import express, { json, urlencoded } from 'express';
import path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || 3501);
  const rawCorsOrigin = (process.env.CORS_ORIGIN || '').trim();
  const corsOrigin =
    !rawCorsOrigin || rawCorsOrigin === '*' || rawCorsOrigin === 'true'
      ? true
      : rawCorsOrigin.includes(',')
        ? rawCorsOrigin
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : rawCorsOrigin;
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const uploadBaseDir = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(__dirname, '..', uploadDir);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.use('/uploads', express.static(uploadBaseDir));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  await app.listen(port);
  console.log(`服务已启动，监听端口: ${port}`);
}
bootstrap();
