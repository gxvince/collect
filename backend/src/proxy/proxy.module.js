import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import multer from 'multer';
import { AuthModule } from '../auth/auth.module';
import { SiteModule } from '../site/site.module';
import { ProxyController } from './proxy.controller';
import { WpClientService } from './wp-client.service';

@Module({
  imports: [AuthModule, SiteModule],
  controllers: [ProxyController],
  providers: [WpClientService],
})
export class ProxyModule {
  configure(consumer) {
    const maxSizeMb = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: maxSizeMb * 1024 * 1024 },
    });

    consumer
      .apply(upload.single('file'))
      .forRoutes(
        { path: 'api/proxy/upload_image', method: RequestMethod.POST },
        { path: 'api/proxy/site_icon', method: RequestMethod.POST },
      );
  }
}
