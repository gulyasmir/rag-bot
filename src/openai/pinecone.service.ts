import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { readFileSync, writeFileSync } from 'fs';

const questionFileName = process.env.QUESTION_FILE;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.INDEX_NAME;
const theme = process.env.THEME;
const model = 'multilingual-e5-large';
type Metadata = { size: number; tags?: string[] | null };

/*
// us-east-1

Supported methods:
pinecone.delete()
pinecone.describeIndexStats()
pinecone.fetch()
pinecone.query()
pinecone.update()
pinecone.upsert()
pinecone.createIndex()
pinecone.deleteIndex()
*/

interface fileNamesI {
  namespaceName: string;
  fileName: string;
}

@Injectable()
export class PineconeService {
  private index: any;

  private pc = new Pinecone({
    apiKey: pineconeApiKey,
  });
  constructor() {
    // this.index = this.pinecone.Index(pineconeIndexName);
  }

  async learn(fileNamesArray: fileNamesI[]) {
    try {
      const result = await this.initializeVectorStore(fileNamesArray);
      return result;
    } catch (error) {
      console.error(error);
    }
  }

  async uploadData(articles) {
    let newArt = [];
    for (let item of articles) {
      newArt.push({
        id: item.id,
        text: `${item.title}  ${item.content}`,
      });
    }
    writeFileSync(questionFileName, JSON.stringify(newArt, null, 2), 'utf8');
  }

  async getDataFromFile(filePath) {
    const rawData = readFileSync(filePath, 'utf-8');
    const articleData = JSON.parse(rawData);
    return articleData;
  }

  async initializeVectorStore(fileNamesArray) {
    for (let item of fileNamesArray) {
      const data = await this.getDataFromFile(item.fileName);

      await this.pc.listIndexes();
      const embeddings = await this.pc.inference.embed(
        model,
        data.map((d) => d.text),
        { inputType: 'passage', truncate: 'END' },
      );

      const existingIndexes = await this.pc.listIndexes();

      if (!existingIndexes) {
        await this.pc.createIndex({
          name: pineconeIndexName,
          dimension: 1024,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });
        this.index = this.pc.Index(pineconeIndexName); // Get a reference to the newly created index
      } else {
        console.log(
          `Index "${pineconeIndexName}" already exists. Using existing index.`,
        );
        this.index = this.pc.Index(pineconeIndexName); // Get a reference to the existing index
      }

      const records = data.map((d, i) => ({
        id: d.id,
        values: embeddings[i].values,
        metadata: { text: d.text },
      }));

      // Upsert the vectors into the index
      await this.index.namespace(item.namespaceName).upsert(records);
      const stats = await this.index.describeIndexStats();
    }

    return `Векторное хранище создано`;
  }

  async query(namespaceName: string, query: string) {
    try {
      const existingIndexes = await this.pc.listIndexes();
      if (!existingIndexes) {
        throw new InternalServerErrorException(
          'Требуется создать векторное хранилище',
        );
        /*
          либо прописать по умолчанию payload для метода learn и вызывать его
          await this.learn(payload);
        */
      } else {
        this.index = this.pc.Index(pineconeIndexName); // Get a reference to the existing index
      }

      // Convert the query into a numerical vector that Pinecone can search with
      const queryEmbedding = await this.pc.inference.embed(model, [query], {
        inputType: 'query',
      });

      // Search the index for the three most similar vectors
      const queryResponse = await this.index.namespace(namespaceName).query({
        topK: 3,
        vector: queryEmbedding[0].values,
        includeValues: false,
        includeMetadata: true,
      });
      /*
      если хотим посмотреть что там формируется
      for (let obj of queryResponse.matches) {
        console.log(obj.metadata);
      }
      */
      let result = queryResponse.matches.map((obj) => obj.metadata.text);
      return result.join(' ');
    } catch (error) {
      console.error(error);
    }
  }

  async finish(pineconeIndexName) {
    // удалить индекс, здесь это не требуется.
    await this.pc.deleteIndex(pineconeIndexName);
  }
}
