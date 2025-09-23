import 'dotenv/config';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import * as fs from 'fs';
import { QdrantVectorStore } from '@langchain/qdrant';
import { connectToVectorDB } from './vectordb/index';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Configuration
const CONFIG = {
  PDF_PATH: './Ak-leave-policy.pdf', // Change this to your PDF file path
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'your-google-api-key-here',
  CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 75,
  EMBEDDING_MODEL: 'models/text-embedding-004', // Latest Google embedding model
};

class PDFEmbeddingProcessor {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private vectorStore: QdrantVectorStore | null = null;

  constructor() {
    console.log('🚀 Initializing PDF Embedding Processor...');

    // Initialize Google embeddings
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: CONFIG.GOOGLE_API_KEY,
      model: CONFIG.EMBEDDING_MODEL,
    });

    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CONFIG.CHUNK_SIZE,
      chunkOverlap: CONFIG.CHUNK_OVERLAP,
    });

    console.log('✅ Processor initialized successfully');
    console.log(`📊 Configuration:
    - Chunk Size: ${CONFIG.CHUNK_SIZE}
    - Chunk Overlap: ${CONFIG.CHUNK_OVERLAP}
    - Embedding Model: ${CONFIG.EMBEDDING_MODEL}`);
  }

  async loadPDF(filePath: string): Promise<Document[]> {
    console.log('\n📖 Step 1: Loading PDF file...');
    console.log(`📁 File path: ${filePath}`);

    try {
      const loader = new PDFLoader(filePath);
      const documents = await loader.load();

      console.log(`✅ PDF loaded successfully!`);
      console.log(`📄 Total pages: ${documents.length}`);

      // Log some metadata about the loaded documents
      documents.forEach((doc, index) => {
        console.log(
          `   Page ${index + 1}: ${doc.pageContent.length} characters`
        );
      });

      return documents;
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      throw error;
    }
  }

  async chunkDocuments(documents: Document[]): Promise<Document[]> {
    console.log('\n✂️  Step 2: Chunking documents...');

    try {
      const chunks = await this.textSplitter.splitDocuments(documents);

      console.log(`✅ Documents chunked successfully!`);
      console.log(`🧩 Total chunks created: ${chunks.length}`);
      // Log chunk statistics
      const chunkSizes = chunks.map((chunk) => chunk.pageContent.length);
      const avgChunkSize =
        chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length;
      const minChunkSize = Math.min(...chunkSizes);
      const maxChunkSize = Math.max(...chunkSizes);

      console.log(`📊 Chunk statistics:
      - Average size: ${Math.round(avgChunkSize)} characters
      - Min size: ${minChunkSize} characters
      - Max size: ${maxChunkSize} characters`);

      // Show preview of first few chunks
      chunks.slice(0, 3).forEach((chunk, index) => {
        console.log(`\n📝 Chunk ${index + 1} preview (first 100 chars):`);
        console.log(`"${chunk.pageContent.substring(0, 100)}..."`);
      });

      return chunks;
    } catch (error) {
      console.error('❌ Error chunking documents:', error);
      throw error;
    }
  }

  async initVectorStore() {
    if (!this.vectorStore) {
      this.vectorStore = await connectToVectorDB();
      console.log('✅ Connected to Qdrant vector store');
    }
  }

  async createEmbeddings(chunks: Document[]): Promise<void> {
    console.log('\n🧠 Step 3: Creating embeddings and storing in vector DB...');
    console.log(`🔄 Processing ${chunks.length} chunks...`);
    await this.initVectorStore();
    try {
      const startTime = Date.now();
      const docsToStore = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        console.log(`\n📊 Processing chunk ${i + 1}/${chunks.length}...`);
        console.log(
          `📝 Chunk content length: ${chunk.pageContent.length} characters`
        );

        // Create embedding for this chunk
        const embedding = await this.embeddings.embedQuery(chunk.pageContent);

        // Store in Qdrant
        docsToStore.push({
          pageContent: chunk.pageContent,
          metadata: chunk.metadata || {},
        });

        // Add some delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      // Store all docs in Qdrant
      if (this.vectorStore) {
        await this.vectorStore.addDocuments(docsToStore);
        console.log(`✅ All chunks stored in Qdrant vector DB!`);
      }

      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      console.log(`\n🎉 All embeddings created successfully!`);
      console.log(
        `⏱️  Total processing time: ${processingTime.toFixed(2)} seconds`
      );
      console.log(
        `⚡ Average time per chunk: ${(processingTime / chunks.length).toFixed(
          2
        )} seconds`
      );
    } catch (error) {
      console.error('❌ Error creating embeddings:', error);
      throw error;
    }
  }

  async queryVectorDB(
    query: string,
    topK: number = 5
  ): Promise<[Document<Record<string, any>>, number][]> {
    await this.initVectorStore();
    console.log(`\n🔍 Querying vector DB for: "${query}"`);
    const embedding = await this.embeddings.embedQuery(query);
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }
    const results = await this.vectorStore.similaritySearchVectorWithScore(
      embedding,
      topK
    );
    // results.forEach(([doc, score], idx) => {
    //   console.log(`\nResult #${idx + 1} (score: ${score.toFixed(4)}):`);
    //   console.log(
    //     doc.pageContent.substring(0, 300) +
    //       (doc.pageContent.length > 300 ? '...' : '')
    //   );
    // });
    return results;
  }

  /**
   * Generate a user-friendly response using a chat model, given the user query and vector DB results.
   * @param userQuery The user's question
   * @param vectorResults Array of [Document, score] from vector DB
   * @param options Optional: { formatInstruction: string, model: string }
   */
  async generateResponseWithChatModel(
    userQuery: string,
    vectorResults: [Document<Record<string, any>>, number][],
    options?: { formatInstruction?: string; model?: string }
  ): Promise<string> {
    // Prepare context from vector results
    const context = vectorResults
      .map(
        ([doc, score], idx) =>
          `Context #${idx + 1} (score: ${score.toFixed(
            4
          )}):\n${doc.pageContent.substring(0, 500)}$${
            doc.pageContent.length > 500 ? '...' : ''
          }`
      )
      .join('\n\n');

    // Default instruction for the chat model
    const instruction =
      options?.formatInstruction ||
      `You are an HR leave policy assistant agent. Analyze the results from the vector database and the provided content, and do your best to answer the user's question. Clean and clarify the user's query if needed, and provide a helpful, human-like answer using ONLY the provided context.\n\nFormat your answer as follows:\n- Start with a clear, friendly, and concise answer.\n- If relevant, cite the context number(s) you used.\n- If the answer is not found in the context, say "I could not find the answer in the provided context."`;

    // Build messages for the chat model
    const messages = [
      new SystemMessage(instruction),
      new HumanMessage(`User question: ${userQuery}\n\nContext:\n${context}`),
    ];

    // Use Gemini 1.5 Flash by default, or override
    const chatModel = new ChatGoogleGenerativeAI({
      apiKey: CONFIG.GOOGLE_API_KEY,
      model: options?.model || 'gemini-1.5-flash',
      temperature: 0.2,
      maxOutputTokens: 512,
    });

    const response = await chatModel.invoke(messages);
    return response.text;
  }

  async processComplete(): Promise<void> {
    console.log('🏁 Starting complete PDF processing pipeline...\n');

    try {
      // Step 1: Load PDF
      const documents = await this.loadPDF(CONFIG.PDF_PATH);

      // Step 2: Chunk documents
      const chunks = await this.chunkDocuments(documents);

      // Step 3: Create embeddings and store in vector DB
      await this.createEmbeddings(chunks);

      console.log('\n🎊 PDF processing pipeline completed successfully!');
    } catch (error) {
      console.error('\n💥 Pipeline failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  // Validate environment
  if (
    !CONFIG.GOOGLE_API_KEY ||
    CONFIG.GOOGLE_API_KEY === 'your-google-api-key-here'
  ) {
    console.error(
      '❌ Please set your GOOGLE_API_KEY environment variable or update the CONFIG object'
    );
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.PDF_PATH)) {
    console.error(`❌ PDF file not found at: ${CONFIG.PDF_PATH}`);
    console.log(
      '💡 Please update the PDF_PATH in CONFIG to point to your PDF file'
    );
    process.exit(1);
  }

  const processor = new PDFEmbeddingProcessor();
  await processor.processComplete();
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

export { PDFEmbeddingProcessor, CONFIG };
