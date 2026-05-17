import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SiteController } from './site.controller';
import { SiteListController } from './site.controller.list';
import { SiteService } from './site.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SiteController, SiteListController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
