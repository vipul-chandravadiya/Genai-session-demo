import 'dotenv/config';
import { loadPDF } from '../steps/pdfLoader';
import { chunkDocuments } from '../steps/chunking';
import { createEmbeddings } from '../steps/embedding';
import { storeEmbeddings, initVectorStore } from '../steps/vectorStore';
import { queryAndGenerate } from '../steps/query';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🏃‍♂️ COMPLETE PIPELINE: ALL STEPS EXECUTABLE');
  console.log('='.repeat(55));

  // Get parameters from command line or use defaults
  const pdfPath =
    process.argv[2] || path.join(__dirname, '../../Ak-leave-policy.pdf');
  const chunkSize = parseInt(process.argv[3]) || 500;
  const chunkOverlap = parseInt(process.argv[4]) || 75;
  const userQuery =
    process.argv.slice(5).join(' ') || 'What is the leave policy?';

  // Configuration
  const config = {
    apiKey: process.env.GOOGLE_API_KEY,
    chunkSize,
    chunkOverlap,
    embeddingModel: 'text-embedding-004',
    chatModel: 'gemini-1.5-flash',
  };

  console.log('\n📋 PIPELINE CONFIGURATION:');
  console.log('='.repeat(30));
  console.log(`📁 PDF Path: ${pdfPath}`);
  console.log(`📏 Chunk Size: ${chunkSize} characters`);
  console.log(`🔄 Overlap: ${chunkOverlap} characters`);
  console.log(`❓ Query: "${userQuery}"`);
  console.log(`🧠 Embedding Model: ${config.embeddingModel}`);
  console.log(`💬 Chat Model: ${config.chatModel}`);

  // Validate inputs
  if (!config.apiKey || config.apiKey === 'your-google-api-key-here') {
    console.error('\n❌ Please set your GOOGLE_API_KEY environment variable');
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error('\n❌ PDF file not found!');
    console.log('\n💡 USAGE:');
    console.log(
      'npm run pipeline -- <pdf-path> [chunk-size] [overlap] [query...]'
    );
    process.exit(1);
  }

  const overallStartTime = Date.now();

  try {
    // =============================================================================
    console.log('\n🏁 STEP 1: PDF LOADING');
    console.log('='.repeat(25));
    const step1Start = Date.now();

    const documents = await loadPDF(pdfPath);

    const step1End = Date.now();
    console.log(
      `⏱️  Step 1 completed in ${((step1End - step1Start) / 1000).toFixed(2)}s`
    );

    // =============================================================================
    console.log('\n✂️  STEP 2: DOCUMENT CHUNKING');
    console.log('='.repeat(30));
    const step2Start = Date.now();

    const chunks = await chunkDocuments(documents, chunkSize, chunkOverlap);

    const step2End = Date.now();
    console.log(
      `⏱️  Step 2 completed in ${((step2End - step2Start) / 1000).toFixed(2)}s`
    );

    // =============================================================================
    console.log('\n🧠 STEP 3: EMBEDDING CREATION');
    console.log('='.repeat(30));
    const step3Start = Date.now();

    console.log(`🔄 Creating embeddings for ${chunks.length} chunks...`);
    const embeddingsWithChunks = await createEmbeddings(
      chunks,
      config.apiKey!,
      config.embeddingModel
    );

    const step3End = Date.now();
    console.log(
      `⏱️  Step 3 completed in ${((step3End - step3Start) / 1000).toFixed(2)}s`
    );

    // =============================================================================
    console.log('\n💾 STEP 4: VECTOR STORAGE');
    console.log('='.repeat(25));
    const step4Start = Date.now();

    console.log('🔌 Connecting to vector database...');
    await initVectorStore();

    console.log('💾 Storing embeddings...');
    await storeEmbeddings(chunks);

    const step4End = Date.now();
    console.log(
      `⏱️  Step 4 completed in ${((step4End - step4Start) / 1000).toFixed(2)}s`
    );

    // =============================================================================
    console.log('\n🔍 STEP 5: QUERY & GENERATION');
    console.log('='.repeat(30));
    const step5Start = Date.now();

    console.log(`🔎 Processing query: "${userQuery}"`);
    const result = await queryAndGenerate(
      userQuery,
      config.apiKey!,
      config.embeddingModel,
      config.chatModel,
      3
    );

    const step5End = Date.now();
    console.log(
      `⏱️  Step 5 completed in ${((step5End - step5Start) / 1000).toFixed(2)}s`
    );

    // =============================================================================
    const overallEndTime = Date.now();
    const totalTime = (overallEndTime - overallStartTime) / 1000;

    console.log('\n📊 COMPLETE PIPELINE SUMMARY');
    console.log('='.repeat(35));

    // Step-by-step timing
    console.log('\n⏱️  TIMING BREAKDOWN:');
    const timings = [
      { step: 'PDF Loading', time: (step1End - step1Start) / 1000 },
      { step: 'Chunking', time: (step2End - step2Start) / 1000 },
      { step: 'Embeddings', time: (step3End - step3Start) / 1000 },
      { step: 'Vector Storage', time: (step4End - step4Start) / 1000 },
      { step: 'Query & Gen', time: (step5End - step5Start) / 1000 },
    ];

    timings.forEach(({ step, time }) => {
      const percentage = ((time / totalTime) * 100).toFixed(1);
      console.log(
        `   ${step.padEnd(15)}: ${time.toFixed(2)}s (${percentage}%)`
      );
    });

    console.log(`\n🎯 TOTAL TIME: ${totalTime.toFixed(2)} seconds`);

    // Data flow summary
    console.log('\n📊 DATA FLOW SUMMARY:');
    console.log(`📄 PDF Pages: ${documents.length}`);
    console.log(`🧩 Text Chunks: ${chunks.length}`);
    console.log(`🔢 Embeddings: ${embeddingsWithChunks.length}`);
    console.log(`🔍 Similar Docs Found: ${result.results.length}`);

    // Performance metrics
    const totalChars = chunks.reduce(
      (sum, chunk) => sum + chunk.pageContent.length,
      0
    );
    console.log(`📝 Characters Processed: ${totalChars.toLocaleString()}`);
    console.log(
      `⚡ Processing Speed: ${(totalChars / totalTime).toFixed(0)} chars/sec`
    );

    // Show similarity results
    console.log('\n🔍 SIMILARITY SEARCH RESULTS:');
    result.results.forEach(([doc, score], index) => {
      console.log(
        `   ${index + 1}. Score: ${score.toFixed(4)} | Length: ${
          doc.pageContent.length
        } chars`
      );
    });

    // Final answer
    console.log('\n🤖 FINAL AI RESPONSE:');
    console.log('='.repeat(50));
    console.log(result.answer);
    console.log('='.repeat(50));

    // Resource usage estimation
    const estimatedCost = {
      embeddings: (totalChars / 1000000) * 0.00001, // text-embedding-004 pricing
      chat: (result.answer.length / 1000000) * 0.00075, // gemini pricing estimate
    };
    const totalCost = estimatedCost.embeddings + estimatedCost.chat;

    console.log('\n💰 ESTIMATED API COSTS:');
    console.log(`🔢 Embedding: ~$${estimatedCost.embeddings.toFixed(6)}`);
    console.log(`💬 Chat Generation: ~$${estimatedCost.chat.toFixed(6)}`);
    console.log(`🎯 Total: ~$${totalCost.toFixed(6)}`);

    // Success indicators
    console.log('\n✅ PIPELINE SUCCESS INDICATORS:');
    console.log(`📄 All ${documents.length} PDF pages processed`);
    console.log(`🧩 All ${chunks.length} chunks embedded`);
    console.log(`💾 All embeddings stored in vector DB`);
    console.log(`🔍 Found ${result.results.length} relevant context documents`);
    console.log(`🤖 Generated ${result.answer.length} character response`);

    console.log('\n🎉 COMPLETE PIPELINE EXECUTED SUCCESSFULLY!');
    console.log('🎯 RAG system is fully operational and ready for queries');
  } catch (error) {
    console.error('\n❌ PIPELINE FAILED:', error);

    const currentTime = Date.now();
    const elapsedTime = (currentTime - overallStartTime) / 1000;
    console.log(`💥 Failed after ${elapsedTime.toFixed(2)} seconds`);

    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check Google API key and quota');
    console.log('2. Ensure Qdrant vector database is running');
    console.log('3. Verify PDF file is readable');
    console.log('4. Check network connectivity');
    console.log('5. Review error message above for specific issues');

    process.exit(1);
  }
}

// Help information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📚 COMPLETE RAG PIPELINE');
  console.log('='.repeat(25));
  console.log('Executes all 5 steps of the RAG pipeline in sequence:\n');
  console.log('1. 📖 PDF Loading - Extract text from PDF');
  console.log('2. ✂️  Chunking - Split into manageable pieces');
  console.log('3. 🧠 Embeddings - Create vector representations');
  console.log('4. 💾 Storage - Store in vector database');
  console.log('5. 🔍 Query - Search and generate response\n');

  console.log('💡 USAGE:');
  console.log(
    'npm run pipeline -- <pdf-path> [chunk-size] [overlap] [query...]'
  );
  console.log('\n📝 EXAMPLES:');
  console.log('npm run pipeline -- "./document.pdf" "What is the policy?"');
  console.log('npm run pipeline -- "./manual.pdf" 1000 100 "How to apply?"');
  console.log('\n🔧 REQUIREMENTS:');
  console.log('• Google API Key (GOOGLE_API_KEY environment variable)');
  console.log('• Qdrant vector database running on localhost:6333');
  console.log('• Valid PDF file to process');

  process.exit(0);
}

main().catch(console.error);
