import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import multer from 'multer';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { DemoMediaConfigController } from './demo-media-config.controller';
import { DemoMediaConfigService } from './demo-media-config.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [MediaController, DemoMediaConfigController],
  providers: [MediaService, DemoMediaConfigService],
})
export class MediaModule {
  configure(consumer) {
    const maxSizeMb = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: maxSizeMb * 1024 * 1024 },
    });

    consumer
      .apply(upload.single('file'))
      .forRoutes({ path: 'api/media/save', method: RequestMethod.POST });
  }
}
