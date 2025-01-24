import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { PineconeService } from './pinecone.service';


@Module({

  controllers: [OpenaiController],
  providers: [OpenaiService, PineconeService],
  exports: [OpenaiService, PineconeService],
})
export class OpenaiModule {}
