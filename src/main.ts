import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '1550mb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '1550mb' }))

  const config = new DocumentBuilder()
    .setTitle('rag')
    .setDescription('rag-bot')
    .setVersion('1.0')
    .addTag('hakaton')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(3001);
}
bootstrap();
