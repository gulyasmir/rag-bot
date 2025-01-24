import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OpenaiService } from './openai.service';

import { PineconeService } from './pinecone.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryDto } from './dto/query.dto';
import { LearnDto } from './dto/learn.dto';
import { UploadDataDto } from './dto/upload-data.dto';

@ApiTags('openai')
@Controller('openai')
export class OpenaiController {
  constructor(
    private readonly pineconeService: PineconeService,
    private readonly openaiService: OpenaiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Создать векторное хранище' })
  run(@Body() payload: LearnDto[]) {
    return this.pineconeService.learn(payload);
  }

  @Get('queryGerenation')
  @ApiOperation({ summary: 'Сгенерировать вопросы' })
  queryGerenation(@Body() payload: QueryDto) {
    return this.openaiService.queryGerenation(payload);
  }

  @Get('uploadData')
  @ApiOperation({ summary: 'Сгенерировать вопросы' })
  textProcess(@Body() payload: UploadDataDto) {
    return this.pineconeService.uploadData(payload);
  }
}
