import 'dotenv/config';
import { loadPDF } from '../steps/pdfLoader';
import { chunkDocuments } from '../steps/chunking';
import { createEmbeddings } from '../steps/embedding';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🏃‍♂️ STEP 3 EXECUTABLE: EMBEDDING CREATION');
  console.log('='.repeat(50));

  // Get parameters from command line or use defaults
  const pdfPath =
    process.argv[2] || path.join(__dirname, '../../Ak-leave-policy.pdf');
  const chunkSize = parseInt(process.argv[3]) || 500;
  const chunkOverlap = parseInt(process.argv[4]) || 75;
  const maxChunks = parseInt(process.argv[5]) || 5; // Limit for demo purposes

  // Input validation
  console.log('\n📋 INPUT PARAMETERS:');
  console.log(`📁 PDF Path: ${pdfPath}`);
  console.log(`📏 Chunk Size: ${chunkSize} characters`);
  console.log(`🔄 Overlap: ${chunkOverlap} characters`);
  console.log(`🎯 Max chunks to process: ${maxChunks} (demo limit)`);

  // Validate API key
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'your-google-api-key-here') {
    console.error('❌ Please set your GOOGLE_API_KEY environment variable');
    console.log('\n🔧 SETUP REQUIRED:');
    console.log('1. Get API key from Google AI Studio');
    console.log('2. Set environment variable: GOOGLE_API_KEY=your_key');
    console.log('3. Or create .env file with GOOGLE_API_KEY=your_key');
    process.exit(1);
  }
  console.log('✅ Google API Key found');

  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found!');
    console.log('\n💡 USAGE:');
    console.log(
      'npm run step3-embedding -- <path> [chunk-size] [overlap] [max-chunks]'
    );
    console.log(
      'Example: npm run step3-embedding -- "./my-doc.pdf" 1000 100 10'
    );
    process.exit(1);
  }

  console.log('\n🔄 PROCESSING...');
  console.log('-'.repeat(30));

  try {
    const startTime = Date.now();

    // Step 1: Load PDF
    console.log('\n📖 Loading PDF...');
    const documents = await loadPDF(pdfPath);
    const loadTime = Date.now();

    // Step 2: Chunk documents
    const allChunks = await chunkDocuments(documents, chunkSize, chunkOverlap);
    const chunkTime = Date.now();

    // Limit chunks for demo
    const chunks = allChunks.slice(0, maxChunks);
    if (allChunks.length > maxChunks) {
      console.log(
        `\n⚠️  Processing only first ${maxChunks} chunks (out of ${allChunks.length}) for demo`
      );
    }

    // Step 3: Create embeddings
    console.log(`\n🧠 Creating embeddings for ${chunks.length} chunks...`);
    const embeddingsWithChunks = await createEmbeddings(chunks, apiKey);

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    const embeddingTime = (endTime - chunkTime) / 1000;

    // Output analysis
    console.log('\n📊 EMBEDDING ANALYSIS:');
    console.log('-'.repeat(30));
    console.log(`✅ Created ${embeddingsWithChunks.length} embeddings`);
    console.log(
      `⏱️  Total time: ${totalTime.toFixed(
        2
      )}s (embedding: ${embeddingTime.toFixed(2)}s)`
    );
    console.log(
      `⚡ Embeddings per second: ${(
        embeddingsWithChunks.length / embeddingTime
      ).toFixed(2)}`
    );
    console.log(
      `🕐 Average time per embedding: ${(
        embeddingTime / embeddingsWithChunks.length
      ).toFixed(2)}s`
    );

    // Embedding vector analysis
    if (embeddingsWithChunks.length > 0) {
      const firstEmbedding = embeddingsWithChunks[0].embedding;
      console.log('\n🔢 VECTOR ANALYSIS:');
      console.log(`📐 Embedding dimensions: ${firstEmbedding.length}`);
      console.log(
        `💾 Memory per embedding: ~${(
          (firstEmbedding.length * 4) /
          1024
        ).toFixed(2)} KB`
      );
      console.log(
        `💾 Total embedding memory: ~${(
          (embeddingsWithChunks.length * firstEmbedding.length * 4) /
          1024 /
          1024
        ).toFixed(2)} MB`
      );

      // Statistical analysis of embedding values
      const allValues = embeddingsWithChunks.flatMap((item) => item.embedding);
      const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;
      const maxValue = Math.max(...allValues);
      const minValue = Math.min(...allValues);

      console.log('\n📈 EMBEDDING STATISTICS:');
      console.log(`📊 Average value: ${avgValue.toFixed(6)}`);
      console.log(`📏 Max value: ${maxValue.toFixed(6)}`);
      console.log(`📐 Min value: ${minValue.toFixed(6)}`);
      console.log(`📉 Range: ${(maxValue - minValue).toFixed(6)}`);
    }

    // Show detailed embedding info for first few chunks
    console.log('\n🔍 EMBEDDING DETAILS:');
    console.log('-'.repeat(30));

    embeddingsWithChunks.slice(0, 3).forEach((item, index) => {
      console.log(`\n📝 Chunk ${index + 1}:`);
      console.log(
        `📄 Content (${
          item.chunk.pageContent.length
        } chars): "${item.chunk.pageContent
          .substring(0, 100)
          .replace(/\n/g, ' ')
          .trim()}..."`
      );
      console.log(`🔢 Embedding preview (first 10 values):`);
      console.log(
        `   [${item.embedding
          .slice(0, 10)
          .map((v) => v.toFixed(4))
          .join(', ')}...]`
      );

      // Calculate embedding magnitude (L2 norm)
      const magnitude = Math.sqrt(
        item.embedding.reduce((sum, val) => sum + val * val, 0)
      );
      console.log(`📏 Vector magnitude: ${magnitude.toFixed(6)}`);

      if (item.chunk.metadata && Object.keys(item.chunk.metadata).length > 0) {
        console.log(`🏷️  Metadata:`, item.chunk.metadata);
      }
    });

    // Similarity analysis between first few embeddings
    if (embeddingsWithChunks.length > 1) {
      console.log('\n🔍 SIMILARITY ANALYSIS:');
      console.log('-'.repeat(30));

      function cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(
          a.reduce((sum, val) => sum + val * val, 0)
        );
        const magnitudeB = Math.sqrt(
          b.reduce((sum, val) => sum + val * val, 0)
        );
        return dotProduct / (magnitudeA * magnitudeB);
      }

      for (let i = 0; i < Math.min(3, embeddingsWithChunks.length - 1); i++) {
        const similarity = cosineSimilarity(
          embeddingsWithChunks[i].embedding,
          embeddingsWithChunks[i + 1].embedding
        );
        console.log(
          `Chunks ${i + 1}-${i + 2} similarity: ${similarity.toFixed(4)} (${(
            similarity * 100
          ).toFixed(1)}%)`
        );
      }
    }

    // API usage estimation
    const estimatedTokens = chunks.reduce(
      (sum, chunk) => sum + Math.ceil(chunk.pageContent.length / 4),
      0
    );
    console.log('\n💰 API USAGE ESTIMATION:');
    console.log(
      `🎯 Estimated tokens used: ~${estimatedTokens.toLocaleString()}`
    );
    console.log(
      `💸 Estimated cost (text-embedding-004): ~$${(
        (estimatedTokens / 1000000) *
        0.00001
      ).toFixed(6)}`
    );

    // Success summary
    console.log('\n🎉 STEP 3 COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    const dimensionCount =
      embeddingsWithChunks.length > 0
        ? embeddingsWithChunks[0].embedding.length
        : 0;
    console.log(
      `📤 OUTPUT: ${embeddingsWithChunks.length} embeddings with ${dimensionCount}D vectors`
    );
    console.log(`🎯 Ready for vector storage and similarity search`);
    console.log(
      '➡️  Next step: Run vector storage with "npm run step4-vectorstore"'
    );

    if (allChunks.length > maxChunks) {
      console.log(
        `\n💡 NOTE: Only processed ${maxChunks}/${allChunks.length} chunks. Increase limit or run full pipeline.`
      );
    }
  } catch (error) {
    console.error('\n❌ STEP 3 FAILED:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Check your Google API key is valid and has quota');
    console.log('• Verify internet connection for API calls');
    console.log('• Try reducing the number of chunks if rate limited');
    console.log('• Check Google AI Studio for API usage and limits');
    process.exit(1);
  }
}

main().catch(console.error);
