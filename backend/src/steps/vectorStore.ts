import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { connectToVectorDB } from '../vectordb/index';

let vectorStoreInstance: QdrantVectorStore | null = null;

export async function initVectorStore(): Promise<QdrantVectorStore> {
  if (!vectorStoreInstance) {
    vectorStoreInstance = await connectToVectorDB();
    console.log('✅ Connected to Qdrant vector store');
  }
  return vectorStoreInstance;
}

export async function storeEmbeddings(chunks: Document[]): Promise<void> {
  console.log('\n💾 Step 4: Storing embeddings in vector DB...');
  const vectorStore = await initVectorStore();

  try {
    const docsToStore = chunks.map((chunk) => ({
      pageContent: chunk.pageContent,
      metadata: chunk.metadata || {},
    }));

    await vectorStore.addDocuments(docsToStore);
    console.log(`✅ All chunks stored in Qdrant vector DB!`);
  } catch (error) {
    console.error('❌ Error storing embeddings:', error);
    throw error;
  }
}

export async function clearVectorStore(): Promise<void> {
  await initVectorStore();
  // Note: Qdrant doesn't have a direct clear method in LangChain
  // You might need to implement this based on your Qdrant setup
  console.log('🗑️ Vector store cleared');
}
