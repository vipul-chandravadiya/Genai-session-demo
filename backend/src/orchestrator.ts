import 'dotenv/config';
import { loadPDF } from './steps/pdfLoader';
import { chunkDocuments } from './steps/chunking';
import { createEmbeddings } from './steps/embedding';
import { storeEmbeddings } from './steps/vectorStore';
import { queryAndGenerate } from './steps/query';

export interface PDFProcessingConfig {
  apiKey: string;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingModel?: string;
  chatModel?: string;
}

export async function processPDF(
  filePath: string,
  config: PDFProcessingConfig
): Promise<void> {
  console.log('🏁 Starting complete PDF processing pipeline...\n');

  const {
    apiKey,
    chunkSize = 500,
    chunkOverlap = 75,
    embeddingModel = 'text-embedding-004',
  } = config;

  try {
    // Step 1: Load PDF
    const documents = await loadPDF(filePath);

    // Step 2: Chunk documents
    const chunks = await chunkDocuments(documents, chunkSize, chunkOverlap);

    // Step 3: Create embeddings (optional step for logging)
    await createEmbeddings(chunks, apiKey, embeddingModel);

    // Step 4: Store in vector DB
    await storeEmbeddings(chunks);

    console.log('\n🎊 PDF processing pipeline completed successfully!');
  } catch (error) {
    console.error('\n💥 Pipeline failed:', error);
    throw error;
  }
}

export async function queryKnowledgeBase(
  userQuery: string,
  config: PDFProcessingConfig,
  topK: number = 3
) {
  const {
    apiKey,
    embeddingModel = 'text-embedding-004',
    chatModel = 'gemini-1.5-flash',
  } = config;

  return await queryAndGenerate(
    userQuery,
    apiKey,
    embeddingModel,
    chatModel,
    topK
  );
}
