import { Injectable } from '@nestjs/common';
import { OpenaiService } from 'src/openai/openai.service';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
const TelegramBot = require('node-telegram-bot-api');
dotenv.config({ path: __dirname + '/.env' });
const token = process.env.BOT_TOKEN;
const quizeFile = process.env.QUIZE_FILE;
const questionFileName = process.env.QUESTION_FILE;
const theme = process.env.THEME;

const infoLink1 = 'https://platform.openai.com/docs/overview';
const infoLink2 = 'https://docs.pinecone.io/guides/get-started/overview';
const infoLink3 =
  'https://help.openai.com/en/articles/8868588-retrieval-augmented-generation-rag-and-semantic-search-for-gpts';

// Для прода рекомендуется использовать WebHooks
const bot = new TelegramBot(token, { polling: true });
@Injectable()
export class TelegramService {
  private counter = 0;
  private rightAnswerCounter = 0;
  private questions: any[];
  constructor(private openaiService: OpenaiService) {}

  async run() {
    this.questions = await this.getQuestions();
    bot.setMyCommands([
      { command: '/start', description: 'Начнем!' },
      { command: '/test ', description: 'Пройти тест' },
      { command: '/quiz ', description: 'Пройти quiz' },
    ]);

    bot.on('message', async (msg) => {
      const text = msg.text;
      const chatId = msg.chat.id;
      try {
        if (text === '/start') {
          await this.start(chatId, msg.chat);
        } else if (text === '/test') {
          await this.test(chatId, 1);
        } else if (!text.includes('/')) {
          if (this.counter > 0) {
            await this.reply(chatId, text);
          } else {
            await this.dialog(chatId, msg);
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const handlers = {
        '/about': () => this.about(chatId),
        '/info': () => this.info(chatId),
        '/quiz': () => this.quiz(chatId, 1),
        '/test': () => this.test(chatId, 1),
        '/true': () => this.good(chatId),
        '/false': () => this.bad(chatId),
        '/exit': () => this.exit(chatId),
        '/next': () => this.quiz(chatId, 2),
      };

      try {
        if (handlers[query.data]) {
          await handlers[query.data]();
        } else if (query.data.includes('/dialog#')) {
          const text = this.getAfterHashRegex(query.data);
          await this.dialog(chatId, text);
        } else if (query.data.includes('/dialogAnswer#')) {
          const text = this.getAfterHashRegex(query.data);
          await this.reply(chatId, text);
        }

        bot.answerCallbackQuery(query.id);
      } catch (error) {
        console.error(error);
      }
    });
  }

  async reply(chatId, answer) {
    const query = this.questions[this.counter].query;
    const queryAnswer = `На поставленный вопрос ${query} был дан ответ ${answer} Это правильный ответ на поставленный вопрос?`;
    this.counter = 0;
    return this.dialogAnswer(chatId, queryAnswer);
  }

  getAfterHashRegex(str) {
    const match = str.match(/#(.*)/);
    if (match === null) {
      return null; // Или "" - пустая строка
    }
    return match[1];
  }

  async exit(chatId) {
    await bot.sendMessage(
      chatId,
      `Ты молодец! Ответил хорошо на ${this.rightAnswerCounter} из ${this.counter} вопросов!`,
    );

    await bot.sendMessage(chatId, 'Поболтаем?', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Да!',
              callback_data: `/dialog#Я хочу поговорить о ${theme}`,
            },
            {
              text: 'Нет',
              callback_data: `/dialog#Я не хочу говорить о ${theme}`,
            },
          ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  }

  async start(chatId, chat) {
    this.counter = 0;
    await bot.sendMessage(chatId, `Привет, ${chat.first_name}! `, {
      parse_mode: 'HTML',
    });

    bot.sendMessage(
      chatId,
      'Чтобы выбрать что дальше, нажмите на кнопку ниже',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'О боте', callback_data: '/about' },
              { text: 'Ссылки на материалы', callback_data: '/info' },
            ],

            [{ text: 'Поговорим?', callback_data: '/dialog#' }],
            [{ text: '🚀 Пройти квиз', callback_data: '/quiz' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
  }

  async awaitResponse(chatId) {
    await bot.sendChatAction(chatId, 'typing');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  async about(chatId) {
    console.log('about');
    this.awaitResponse(chatId);
    const aboutResponse =
      'Этот бот сделан для демонстрации кода применения технологии RAG и OpenAI для генерации ответа дообученой модели chatGPT.\n\nБот написан на Nestjs.\n\nПри генерации ответов chatGPT возможны "галлюцинации", т.к. когда модели не хватает данных для ответа она выдает ответ похожий на правду, но неверный.\n\nДля решения этой проблемы я использую технологию RAG - создается  векторное хранилище, и обучается заданной теме. При запросе пользователя на данную тему к запросу добавляются данные по этой теме из векторного хранилища.\n\nВ результате OpenAI GPT (или другая модель) отвечает более точно.';

    bot.sendMessage(chatId, aboutResponse, { parse_mode: 'HTML' });
  }

  async info(chatId) {
    //console.log('info');
    this.awaitResponse(chatId);
    const infoResponse = `Ниже приведены ссылки на документацию OpenAI\n ${infoLink1}\n\nPinecone (векторное хранилище данных)\n${infoLink2}\n\n и описание технологии RAG\n ${infoLink3}`;

    bot.sendMessage(chatId, infoResponse, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Поговорим?', callback_data: '/dialog#' }],
          [{ text: '🚀 Пройти квиз', callback_data: '/quiz' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  async dialog(chatId, query) {
    this.awaitResponse(chatId);
    const namespaceName = theme;
    const questionText = query.text;
    const dialogResponse = await this.openaiService.rag(namespaceName, query);
    bot.sendMessage(chatId, dialogResponse);
  }

  async dialogAnswer(chatId, query) {
    this.awaitResponse(chatId);
    const namespaceName = theme;
    const dialogResponse = await this.openaiService.ragAswer(
      namespaceName,
      query,
    );
    bot.sendMessage(chatId, dialogResponse);
  }

  async getQuestions() {
    const rawData = readFileSync(questionFileName, 'utf-8');
    const questions = JSON.parse(rawData);
    return questions;
  }

  async test(chatId, call) {
    const questCount = 10;
    const questions: any[] = this.questions;
    if (call == 1) {
      bot.sendMessage(chatId, 'Привет! Давай начнем викторину!');
      await this.delay();
    }

    const number = Math.floor(Math.random() * questCount - 1) + 1; // при формировании вопросов в chatGPT будет выбирать случайным образом из 10 вопросов.
    const question = questions[number];
    this.counter = number;
    await bot.sendMessage(chatId, question.query);
  }

  async getQuiz() {
    const rawData = readFileSync(quizeFile, 'utf-8');
    const quiz = JSON.parse(rawData);

    const questions: any[] = quiz;
    const transformedQuestions: any[] = questions.map((question) => {
      const correctAnswer = question.answer.split('.')[0];
      const otherQuestions = questions.filter((q) => q.id !== question.id);
      const incorrectAnswers = otherQuestions
        .slice(0, 2)
        .map((q) => q.answer.split('.')[0]);

      // Перемешиваем варианты ответа
      const options = [
        [{ text: incorrectAnswers[0], callback_data: '/false' }],
        [{ text: correctAnswer, callback_data: '/true' }],
        [{ text: incorrectAnswers[1], callback_data: '/false' }],
      ];

      // Перемешиваем порядок вариантов ответа
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        query: question.query,
        correctAnswer: correctAnswer,
        options: options,
      };
    });
    return transformedQuestions;
  }

  async quiz(chatId, call) {
    const questCount = 10;
    const questions: any[] = await this.getQuiz();
    if (call == 1) {
      bot.sendMessage(chatId, 'Привет! Давай начнем!');
      await this.delay();
    }

    const number = Math.floor(Math.random() * questCount - 1) + 1; // при формировании вопросов в chatGPT будет выбирать случайным образом из 10 вопросов.

    const question = questions[number];

    await bot.sendMessage(chatId, question.query, {
      reply_markup: {
        inline_keyboard: question.options,
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  async good(chatId) {
    this.counter++;
    this.rightAnswerCounter++;
    bot.sendMessage(
      chatId,
      'Правильный ответ! Давайте перейдем ко следующему вопросу.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Следующий вопрос', callback_data: '/next' },
              { text: 'Закончить', callback_data: '/exit' },
            ],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      },
    );
  }

  async bad(chatId) {
    this.counter++;
    bot.sendMessage(chatId, `Неправильный ответ.`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Следующий вопрос', callback_data: '/next' },
            { text: 'Закончить', callback_data: '/exit' },
          ],
        ],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  }

  async sendError(chatId) {
    await bot.sendMessage(chatId, `Что-то пошло не так`);
  }

  delay() {
    const randomTime = this.getRandomMilliseconds();
    return new Promise((resolve) => setTimeout(resolve, 1500));
  }

  getRandomMilliseconds(): number {
    const minMilliseconds = 0.1 * 60 * 1000;
    const maxMilliseconds = 0.2 * 60 * 1000;
    const randomMilliseconds =
      Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) +
      minMilliseconds;

    return randomMilliseconds;
  }
}
