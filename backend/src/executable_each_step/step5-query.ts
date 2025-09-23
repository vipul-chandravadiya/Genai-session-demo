import 'dotenv/config';
import { queryAndGenerate, queryVectorDB } from '../steps/query';
import { initVectorStore } from '../steps/vectorStore';

async function main() {
  console.log('🏃‍♂️ STEP 5 EXECUTABLE: QUERY & GENERATION');
  console.log('='.repeat(50));

  // Get parameters from command line or use defaults
  const userQuery =
    process.argv.slice(2).join(' ') || 'What is the leave policy?';
  const topK = parseInt(process.env.TOP_K || '3') || 3;
  const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-004';
  const chatModel = process.env.CHAT_MODEL || 'gemini-1.5-flash';

  // Input validation
  console.log('\n📋 INPUT PARAMETERS:');
  console.log(`❓ User Query: "${userQuery}"`);
  console.log(`🎯 Top K Results: ${topK}`);
  console.log(`🧠 Embedding Model: ${embeddingModel}`);
  console.log(`💬 Chat Model: ${chatModel}`);

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

  // Check vector database connection
  console.log('\n🔌 VECTOR DATABASE CONNECTION:');
  try {
    const vectorStore = await initVectorStore();
    console.log('✅ Successfully connected to Qdrant vector database');
  } catch (error) {
    console.error('❌ Failed to connect to vector database:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Ensure Qdrant is running and has data');
    console.log('• Run previous steps to populate the database');
    console.log('• Check vector database connection settings');
    process.exit(1);
  }

  console.log('\n🔄 PROCESSING...');
  console.log('-'.repeat(30));

  try {
    const startTime = Date.now();

    // Step 1: Query vector database
    console.log('\n🔍 PHASE 1: SIMILARITY SEARCH');
    console.log('-'.repeat(25));
    const searchStartTime = Date.now();

    const vectorResults = await queryVectorDB(
      userQuery,
      apiKey,
      embeddingModel,
      topK
    );

    const searchEndTime = Date.now();
    const searchTime = (searchEndTime - searchStartTime) / 1000;

    console.log(`✅ Found ${vectorResults.length} relevant documents`);
    console.log(`⏱️  Search time: ${searchTime.toFixed(3)} seconds`);

    // Analyze search results
    console.log('\n📊 SIMILARITY SEARCH RESULTS:');
    console.log('-'.repeat(30));

    if (vectorResults.length === 0) {
      console.log('❌ No relevant documents found in the vector database');
      console.log(
        '💡 Try a different query or check if documents are properly stored'
      );
      process.exit(1);
    }

    vectorResults.forEach(([doc, score], index) => {
      console.log(`\n🔍 Result ${index + 1}:`);
      console.log(
        `   📊 Similarity Score: ${score.toFixed(6)} (${(score * 100).toFixed(
          2
        )}%)`
      );
      console.log(`   📄 Content Length: ${doc.pageContent.length} characters`);

      // Show content preview
      const preview = doc.pageContent
        .substring(0, 150)
        .replace(/\n/g, ' ')
        .trim();
      console.log(`   📝 Content Preview: "${preview}..."`);

      // Show metadata if available
      if (doc.metadata && Object.keys(doc.metadata).length > 0) {
        console.log(`   🏷️  Metadata:`, doc.metadata);
      }

      // Relevance assessment
      let relevanceLabel = '';
      if (score > 0.8) relevanceLabel = '🟢 Highly Relevant';
      else if (score > 0.6) relevanceLabel = '🟡 Moderately Relevant';
      else if (score > 0.4) relevanceLabel = '🟠 Somewhat Relevant';
      else relevanceLabel = '🔴 Low Relevance';

      console.log(`   ${relevanceLabel}`);
    });

    // Similarity analysis
    const scores = vectorResults.map(([, score]) => score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore;

    console.log('\n📈 SIMILARITY ANALYSIS:');
    console.log(`🎯 Best match score: ${maxScore.toFixed(6)}`);
    console.log(`📊 Average score: ${avgScore.toFixed(6)}`);
    console.log(`📉 Lowest score: ${minScore.toFixed(6)}`);
    console.log(`📏 Score range: ${scoreRange.toFixed(6)}`);

    // Step 2: Generate AI response
    console.log('\n🤖 PHASE 2: AI RESPONSE GENERATION');
    console.log('-'.repeat(35));
    const generationStartTime = Date.now();

    const result = await queryAndGenerate(
      userQuery,
      apiKey,
      embeddingModel,
      chatModel,
      topK
    );

    const generationEndTime = Date.now();
    const generationTime = (generationEndTime - generationStartTime) / 1000;
    const totalTime = (generationEndTime - startTime) / 1000;

    console.log(`✅ AI response generated successfully`);
    console.log(`⏱️  Generation time: ${generationTime.toFixed(3)} seconds`);
    console.log(`⏱️  Total query time: ${totalTime.toFixed(3)} seconds`);

    // Response analysis
    console.log('\n📊 RESPONSE ANALYSIS:');
    console.log('-'.repeat(25));
    console.log(`📝 Response length: ${result.answer.length} characters`);
    console.log(`📄 Word count: ~${result.answer.split(/\s+/).length} words`);
    console.log(
      `📖 Estimated reading time: ~${Math.ceil(
        result.answer.split(/\s+/).length / 200
      )} minutes`
    );

    // Context utilization analysis
    const contextTexts = result.results.map(([doc]) => doc.pageContent);
    const allContextText = contextTexts.join(' ').toLowerCase();
    const responseText = result.answer.toLowerCase();

    // Simple overlap analysis (count common words)
    const contextWords = new Set(
      allContextText.split(/\s+/).filter((word) => word.length > 3)
    );
    const responseWords = new Set(
      responseText.split(/\s+/).filter((word) => word.length > 3)
    );
    const commonWords = new Set(
      [...contextWords].filter((word) => responseWords.has(word))
    );
    const contextUtilizationNum = (commonWords.size / contextWords.size) * 100;
    const contextUtilization = contextUtilizationNum.toFixed(1);

    console.log(
      `🎯 Context utilization: ~${contextUtilization}% (${commonWords.size}/${contextWords.size} key terms)`
    );

    // Performance breakdown
    const searchTimePercent = ((searchTime / totalTime) * 100).toFixed(1);
    const genTimePercent = ((generationTime / totalTime) * 100).toFixed(1);

    console.log('\n⏱️ PERFORMANCE BREAKDOWN:');
    console.log(
      `🔍 Vector Search: ${searchTime.toFixed(3)}s (${searchTimePercent}%)`
    );
    console.log(
      `🤖 AI Generation: ${generationTime.toFixed(3)}s (${genTimePercent}%)`
    );

    // Show the final response
    console.log('\n🎉 FINAL AI RESPONSE:');
    console.log('='.repeat(50));
    console.log(result.answer);
    console.log('='.repeat(50));

    // API usage estimation
    const estimatedTokens = {
      input: Math.ceil((userQuery + allContextText).length / 4),
      output: Math.ceil(result.answer.length / 4),
    };
    const totalTokens = estimatedTokens.input + estimatedTokens.output;

    console.log('\n💰 API USAGE ESTIMATION:');
    console.log(`📥 Input tokens: ~${estimatedTokens.input.toLocaleString()}`);
    console.log(
      `📤 Output tokens: ~${estimatedTokens.output.toLocaleString()}`
    );
    console.log(`🎯 Total tokens: ~${totalTokens.toLocaleString()}`);
    console.log(
      `💸 Estimated cost: ~$${((totalTokens / 1000000) * 0.00075).toFixed(6)}`
    );

    // Quality assessment
    console.log('\n🎯 QUALITY INDICATORS:');
    const hasSpecificInfo =
      result.answer.includes('leave') || result.answer.includes('policy');
    const hasStructure =
      result.answer.includes('•') || result.answer.includes('**');
    const isDetailed = result.answer.length > 200;
    const usesContext = contextUtilizationNum > 20;

    console.log(`✅ Contains relevant info: ${hasSpecificInfo ? 'Yes' : 'No'}`);
    console.log(`📋 Well structured: ${hasStructure ? 'Yes' : 'No'}`);
    console.log(`📖 Detailed response: ${isDetailed ? 'Yes' : 'No'}`);
    console.log(`🎯 Uses context well: ${usesContext ? 'Yes' : 'No'}`);

    // Success summary
    console.log('\n🎉 STEP 5 COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`📤 OUTPUT: Complete RAG pipeline response generated`);
    console.log(
      `🎯 Query processed with ${vectorResults.length} relevant documents`
    );
    console.log(`⚡ Total processing time: ${totalTime.toFixed(3)} seconds`);

    console.log('\n💡 NEXT STEPS:');
    console.log('• Try different queries to test the system');
    console.log('• Adjust topK parameter for more/fewer results');
    console.log('• Experiment with different models');
    console.log('• Add more documents to improve coverage');
  } catch (error) {
    console.error('\n❌ STEP 5 FAILED:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Check if vector database has data (run steps 1-4 first)');
    console.log('• Verify Google API key and quota');
    console.log('• Try a simpler query');
    console.log('• Check network connectivity');
    console.log('• Ensure all previous steps completed successfully');
    process.exit(1);
  }
}

// Example usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n💡 USAGE EXAMPLES:');
  console.log('npm run step5-query -- "What is the leave policy?"');
  console.log('npm run step5-query -- "How many days of leave can I take?"');
  console.log('npm run step5-query -- "What is the application process?"');
  console.log('\n🔧 ENVIRONMENT VARIABLES:');
  console.log('TOP_K=5              # Number of similar documents to retrieve');
  console.log('EMBEDDING_MODEL=text-embedding-004  # Google embedding model');
  console.log('CHAT_MODEL=gemini-1.5-flash        # Google chat model');
  process.exit(0);
}

main().catch(console.error);
