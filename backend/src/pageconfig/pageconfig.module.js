import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SiteModule } from '../site/site.module';
import { PageConfigController } from './pageconfig.controller';
import { PageConfigService } from './pageconfig.service';

@Module({
  imports: [DatabaseModule, AuthModule, SiteModule],
  controllers: [PageConfigController],
  providers: [PageConfigService],
})
export class PageConfigModule {}
