import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import multer from 'multer';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {
  configure(consumer) {
    const maxSizeMb = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: maxSizeMb * 1024 * 1024 },
    });

    consumer
      .apply(upload.single('file'))
      .forRoutes({ path: 'api/file/upload', method: RequestMethod.POST });
  }
}
