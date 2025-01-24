import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { OpenaiModule } from './openai/openai.module';
//import { ServeStaticModule } from '@nestjs/serve-static';
import { StartUpService } from './startup.service';

@Module({
  //imports: [ServeStaticModule.forRoot({
   // serveRoot: '/files', // URL path to access files
  //}),
  imports: [
    TelegramModule,
    OpenaiModule],
  controllers: [AppController],
  providers: [AppService, StartUpService],
})
export class AppModule {}
