import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PineconeService } from './pinecone.service';
import { writeFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/.env' });
const theme = process.env.THEME;
const myApiKey = process.env.OPENAI_API_KEY;
const quizeFile = process.env.QUIZE_FILE;
@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private pineconeService: PineconeService) {
    this.openai = new OpenAI({
      apiKey: myApiKey,
    });
  }

  async queryGerenation(payload) {
    const query = `Сгенерируй массив из 10 вопросов о ${theme} и верни в формате массива, такого вида: 
                    [{
                      "query": "Вопрос?",
                      "anwers": ["Ответ 1", "Ответ 2", "Ответ 3"]
                    }]
                      
                    в anwers должно быть 3 варианта ответа, один правильный и два неправильных.`;

    const addText = await this.rag(payload.namespaceName, payload.theme);
    const queryArray = await this.generateText(addText + '\n' + query);

    const res = await writeFileSync(quizeFile, queryArray);
    return queryArray;
  }

  async rag(namespaceName, query) {
    const prepareData = await this.pineconeService.query(namespaceName, query);
    return this.generateText(prepareData);
  }

  async ragAswer(namespaceName, query) {
    const prepareData = await this.pineconeService.query(namespaceName, query);
    return this.generateText(prepareData + ' ' + query);
  }

  async generateText(prompt: string): Promise<string> {
    console.log('getChatGPTResponse', prompt);
    try {
      const content = `Ты — бот, знаток ${theme}.  На вопрос расскажи про ${theme}  отвечай рассказом на эту тему. Если вопрос не относится к ${theme},
       отвечай: 'Этот вопрос не связан с  ${theme} . Пожалуйста, уточните ваш запрос.'`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4', // либо другая модель
        store: true,
        messages: [
          {
            role: 'system',
            content: content,
          },
          { role: 'user', content: prompt },
        ],
      });
      return (
        response.choices[0]?.message?.content?.trim() || 'Ошибка: пустой ответ.'
      );
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении ответа от ChatGPT. Попробуйте еще раз, пожалуйста.';
    }
  }
}
