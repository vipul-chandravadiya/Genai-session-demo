import 'dotenv/config';
import { loadPDF } from '../steps/pdfLoader';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🏃‍♂️ STEP 1 EXECUTABLE: PDF LOADER');
  console.log('='.repeat(50));

  // Get PDF file path from command line argument or use default
  const pdfPath =
    process.argv[2] || path.join(__dirname, '../../Ak-leave-policy.pdf');

  // Input validation
  console.log('\n📋 INPUT VALIDATION:');
  console.log(`📁 PDF Path: ${pdfPath}`);

  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found!');
    console.log('\n💡 USAGE:');
    console.log('npm run step1-pdf -- <path-to-pdf>');
    console.log('OR');
    console.log('npm run step1-pdf  # Uses default PDF');
    process.exit(1);
  }

  const stats = fs.statSync(pdfPath);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📅 Modified: ${stats.mtime.toLocaleString()}`);

  console.log('\n🔄 PROCESSING...');
  console.log('-'.repeat(30));

  try {
    const startTime = Date.now();

    // Execute the PDF loading step
    const documents = await loadPDF(pdfPath);

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    // Output analysis
    console.log('\n📊 OUTPUT ANALYSIS:');
    console.log('-'.repeat(30));
    console.log(`✅ Successfully loaded ${documents.length} pages`);
    console.log(`⏱️  Processing time: ${processingTime.toFixed(2)} seconds`);

    // Character statistics
    const totalChars = documents.reduce(
      (sum, doc) => sum + doc.pageContent.length,
      0
    );
    const avgCharsPerPage = Math.round(totalChars / documents.length);
    const maxChars = Math.max(
      ...documents.map((doc) => doc.pageContent.length)
    );
    const minChars = Math.min(
      ...documents.map((doc) => doc.pageContent.length)
    );

    console.log('\n📈 CONTENT STATISTICS:');
    console.log(`📝 Total characters: ${totalChars.toLocaleString()}`);
    console.log(
      `📄 Average chars per page: ${avgCharsPerPage.toLocaleString()}`
    );
    console.log(`📏 Longest page: ${maxChars.toLocaleString()} chars`);
    console.log(`📐 Shortest page: ${minChars.toLocaleString()} chars`);

    // Show content preview
    console.log('\n🔍 CONTENT PREVIEW:');
    console.log('-'.repeat(30));
    documents.slice(0, 2).forEach((doc, index) => {
      console.log(`\n📄 Page ${index + 1} (${doc.pageContent.length} chars):`);
      const preview = doc.pageContent
        .substring(0, 200)
        .replace(/\n/g, ' ')
        .trim();
      console.log(`"${preview}..."`);

      // Show metadata if available
      if (doc.metadata && Object.keys(doc.metadata).length > 0) {
        console.log(`🏷️  Metadata:`, doc.metadata);
      }
    });

    // Success summary
    console.log('\n🎉 STEP 1 COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(
      `📤 OUTPUT: ${documents.length} document pages ready for chunking`
    );
    console.log('➡️  Next step: Run chunking with "npm run step2-chunking"');
  } catch (error) {
    console.error('\n❌ STEP 1 FAILED:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Check if the PDF file exists and is readable');
    console.log('• Ensure the PDF is not corrupted');
    console.log('• Try with a different PDF file');
    process.exit(1);
  }
}

main().catch(console.error);
