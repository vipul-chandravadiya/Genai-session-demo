import 'dotenv/config';
import { loadPDF } from '../steps/pdfLoader';
import { chunkDocuments } from '../steps/chunking';
import { storeEmbeddings, initVectorStore } from '../steps/vectorStore';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🏃‍♂️ STEP 4 EXECUTABLE: VECTOR STORE');
  console.log('='.repeat(50));

  // Get parameters from command line or use defaults
  const pdfPath =
    process.argv[2] || path.join(__dirname, '../../Ak-leave-policy.pdf');
  const chunkSize = parseInt(process.argv[3]) || 500;
  const chunkOverlap = parseInt(process.argv[4]) || 75;
  const maxChunks = parseInt(process.argv[5]) || 10; // Limit for demo purposes

  // Input validation
  console.log('\n📋 INPUT PARAMETERS:');
  console.log(`📁 PDF Path: ${pdfPath}`);
  console.log(`📏 Chunk Size: ${chunkSize} characters`);
  console.log(`🔄 Overlap: ${chunkOverlap} characters`);
  console.log(`🎯 Max chunks to store: ${maxChunks} (demo limit)`);

  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found!');
    console.log('\n💡 USAGE:');
    console.log(
      'npm run step4-vectorstore -- <path> [chunk-size] [overlap] [max-chunks]'
    );
    console.log(
      'Example: npm run step4-vectorstore -- "./my-doc.pdf" 1000 100 20'
    );
    process.exit(1);
  }

  // Check vector database connection
  console.log('\n🔌 VECTOR DATABASE CONNECTION:');
  try {
    const vectorStore = await initVectorStore();
    console.log('✅ Successfully connected to Qdrant vector database');
  } catch (error) {
    console.error('❌ Failed to connect to vector database:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log(
      '• Ensure Qdrant is running (docker run -p 6333:6333 qdrant/qdrant)'
    );
    console.log('• Check if the vector database URL is correct');
    console.log('• Verify network connectivity');
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

    console.log('\n💾 STORAGE PREPARATION:');
    console.log(`📦 Preparing ${chunks.length} chunks for storage...`);

    // Calculate storage requirements
    const totalChars = chunks.reduce(
      (sum, chunk) => sum + chunk.pageContent.length,
      0
    );
    const avgChunkSize = totalChars / chunks.length;

    console.log(`📊 Storage requirements:`);
    console.log(`   📝 Total text: ${totalChars.toLocaleString()} characters`);
    console.log(`   📄 Average chunk: ${Math.round(avgChunkSize)} characters`);
    console.log(
      `   💾 Estimated storage: ~${(totalChars / 1024).toFixed(2)} KB text`
    );

    // Show sample chunks that will be stored
    console.log('\n🔍 CHUNKS TO BE STORED:');
    console.log('-'.repeat(30));
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(
        `\n📝 Chunk ${index + 1} (${chunk.pageContent.length} chars):`
      );
      const preview = chunk.pageContent
        .substring(0, 120)
        .replace(/\n/g, ' ')
        .trim();
      console.log(`   "${preview}..."`);

      if (chunk.metadata && Object.keys(chunk.metadata).length > 0) {
        console.log(`   🏷️  Metadata: ${JSON.stringify(chunk.metadata)}`);
      }
    });

    // Step 4: Store in vector database
    console.log('\n💾 Storing embeddings in vector database...');
    const storeStartTime = Date.now();

    await storeEmbeddings(chunks);

    const storeEndTime = Date.now();
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    const storeTime = (storeEndTime - storeStartTime) / 1000;

    // Output analysis
    console.log('\n📊 STORAGE ANALYSIS:');
    console.log('-'.repeat(30));
    console.log(`✅ Successfully stored ${chunks.length} document chunks`);
    console.log(
      `⏱️  Total time: ${totalTime.toFixed(2)}s (storage: ${storeTime.toFixed(
        2
      )}s)`
    );
    console.log(
      `⚡ Chunks stored per second: ${(chunks.length / storeTime).toFixed(2)}`
    );

    // Vector database status
    console.log('\n🗄️ VECTOR DATABASE STATUS:');
    console.log(`📦 Documents stored: ${chunks.length}`);
    console.log(`🔍 Ready for similarity search`);
    console.log(`💾 Database: Qdrant vector store`);

    // Test basic functionality
    console.log('\n🧪 TESTING STORAGE:');
    console.log('-'.repeat(30));
    try {
      const vectorStore = await initVectorStore();
      console.log('✅ Vector store connection verified');
      console.log('🎯 Storage completed successfully');

      // Note: We could add a simple similarity search test here if needed
      console.log('🔍 Vector database is ready for similarity searches');
    } catch (testError) {
      console.warn('⚠️  Storage completed but verification failed:', testError);
    }

    // Performance metrics
    const loadTimePercent = (
      ((loadTime - startTime) / (endTime - startTime)) *
      100
    ).toFixed(1);
    const chunkTimePercent = (
      ((chunkTime - loadTime) / (endTime - startTime)) *
      100
    ).toFixed(1);
    const storeTimePercent = (
      ((storeEndTime - chunkTime) / (endTime - startTime)) *
      100
    ).toFixed(1);

    console.log('\n⏱️ PERFORMANCE BREAKDOWN:');
    console.log(
      `📖 PDF Loading: ${((loadTime - startTime) / 1000).toFixed(
        2
      )}s (${loadTimePercent}%)`
    );
    console.log(
      `✂️  Document Chunking: ${((chunkTime - loadTime) / 1000).toFixed(
        2
      )}s (${chunkTimePercent}%)`
    );
    console.log(
      `💾 Vector Storage: ${storeTime.toFixed(2)}s (${storeTimePercent}%)`
    );

    // Success summary
    console.log('\n🎉 STEP 4 COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(
      `📤 OUTPUT: ${chunks.length} documents stored in vector database`
    );
    console.log(`🎯 Vector database ready for similarity search`);
    console.log('➡️  Next step: Run query with "npm run step5-query"');

    if (allChunks.length > maxChunks) {
      console.log(
        `\n💡 NOTE: Only stored ${maxChunks}/${allChunks.length} chunks. Run full pipeline for complete storage.`
      );
    }
  } catch (error) {
    console.error('\n❌ STEP 4 FAILED:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Ensure Qdrant vector database is running');
    console.log('• Check database connection settings');
    console.log('• Verify sufficient disk space for vector storage');
    console.log('• Check network connectivity to the database');
    process.exit(1);
  }
}

main().catch(console.error);
