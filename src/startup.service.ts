import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';
import { PineconeService } from './openai/pinecone.service';


@Injectable()
export class StartUpService implements OnModuleInit {
    constructor(
      private readonly telegramService: TelegramService,
      private readonly pineconeService: PineconeService
      ) {}

  async onModuleInit() {
    console.log('Module initialized!');
    await this.myStartupFunction();
  }

  async myStartupFunction() {
   // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  //  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('+++                        Приложение запустилось!                              +++')
   // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
   // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

 //   await this.pineconeService.start();

  //  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  //  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('+++                      Хранилище инициализировано                             +++')
  //  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
   // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
   
    return this.telegramService.run();
  }
}