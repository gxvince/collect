import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FileModule } from './file/file.module';
import { SiteModule } from './site/site.module';
import { ProxyModule } from './proxy/proxy.module';
import { TranslateModule } from './translate/translate.module';
import { MediaModule } from './media/media.module';
import { PageConfigModule } from './pageconfig/pageconfig.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    FileModule,
    SiteModule,
    ProxyModule,
    TranslateModule,
    MediaModule,
    PageConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
