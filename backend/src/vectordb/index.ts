import 'dotenv/config';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';

export const connectToVectorDB = async () => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'models/text-embedding-004',
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: 'genai-embedding-demo',
      apiKey: process.env.QDRANT_API_KEY,
    }
  );
  return vectorStore;
};
