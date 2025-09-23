import 'dotenv/config';
import {
  processPDF,
  queryKnowledgeBase,
  PDFProcessingConfig,
} from './orchestrator';
import * as fs from 'fs';

async function testPipeline() {
  console.log('🧪 Testing PDF Processing Pipeline...\n');

  const CONFIG = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'your-google-api-key-here',
    TEST_PDF: './Ak-leave-policy.pdf',
  };

  // Validate environment
  if (
    !CONFIG.GOOGLE_API_KEY ||
    CONFIG.GOOGLE_API_KEY === 'your-google-api-key-here'
  ) {
    console.error('❌ Please set your GOOGLE_API_KEY environment variable');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.TEST_PDF)) {
    console.error(`❌ Test PDF file not found at: ${CONFIG.TEST_PDF}`);
    console.log('💡 Please update the TEST_PDF path or add a PDF file');
    process.exit(1);
  }

  try {
    const config: PDFProcessingConfig = {
      apiKey: CONFIG.GOOGLE_API_KEY,
    };

    // Test 1: Process PDF
    console.log('🔄 Test 1: Processing PDF...');
    await processPDF(CONFIG.TEST_PDF, config);
    console.log('✅ PDF processing completed successfully!\n');

    // Test 2: Query the knowledge base
    console.log('🔄 Test 2: Querying knowledge base...');
    const testQueries = [
      'What is the leave policy?',
      'How many vacation days do employees get?',
      'What are the sick leave rules?',
    ];

    for (const query of testQueries) {
      console.log(`\n📝 Query: "${query}"`);
      const result = await queryKnowledgeBase(query, config, 2);
      console.log(`🤖 Answer: ${result.answer}`);
      console.log(`📊 Sources found: ${result.results.length}`);
    }

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testPipeline().catch(console.error);
}
