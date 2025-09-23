import 'dotenv/config';
import { loadPDF } from '../steps/pdfLoader';
import { chunkDocuments } from '../steps/chunking';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🏃‍♂️ STEP 2 EXECUTABLE: DOCUMENT CHUNKING');
  console.log('='.repeat(50));

  // Get parameters from command line or use defaults
  const pdfPath =
    process.argv[2] || path.join(__dirname, '../../Ak-leave-policy.pdf');
  const chunkSize = parseInt(process.argv[3]) || 500;
  const chunkOverlap = parseInt(process.argv[4]) || 75;

  // Input validation
  console.log('\n📋 INPUT PARAMETERS:');
  console.log(`📁 PDF Path: ${pdfPath}`);
  console.log(`📏 Chunk Size: ${chunkSize} characters`);
  console.log(`🔄 Overlap: ${chunkOverlap} characters`);
  console.log(
    `📊 Overlap Percentage: ${((chunkOverlap / chunkSize) * 100).toFixed(1)}%`
  );

  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF file not found!');
    console.log('\n💡 USAGE:');
    console.log(
      'npm run step2-chunking -- <path-to-pdf> [chunk-size] [overlap]'
    );
    console.log('Example: npm run step2-chunking -- "./my-doc.pdf" 1000 100');
    console.log('OR');
    console.log('npm run step2-chunking  # Uses defaults');
    process.exit(1);
  }

  console.log('\n🔄 PROCESSING...');
  console.log('-'.repeat(30));

  try {
    const startTime = Date.now();

    // Step 1: Load PDF (prerequisite)
    console.log('\n📖 Loading PDF first...');
    const documents = await loadPDF(pdfPath);
    const loadTime = Date.now();

    // Step 2: Chunk documents
    const chunks = await chunkDocuments(documents, chunkSize, chunkOverlap);

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    const chunkTime = (endTime - loadTime) / 1000;

    // Output analysis
    console.log('\n📊 CHUNKING ANALYSIS:');
    console.log('-'.repeat(30));
    console.log(
      `✅ Created ${chunks.length} chunks from ${documents.length} pages`
    );
    console.log(
      `⏱️  Total time: ${totalTime.toFixed(2)}s (chunking: ${chunkTime.toFixed(
        2
      )}s)`
    );
    console.log(
      `⚡ Chunks per second: ${(chunks.length / chunkTime).toFixed(2)}`
    );

    // Detailed chunk statistics
    const chunkSizes = chunks.map((chunk) => chunk.pageContent.length);
    const avgSize = chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length;
    const minSize = Math.min(...chunkSizes);
    const maxSize = Math.max(...chunkSizes);
    const totalChars = chunkSizes.reduce((a, b) => a + b, 0);

    console.log('\n📈 CHUNK STATISTICS:');
    console.log(
      `📝 Total characters processed: ${totalChars.toLocaleString()}`
    );
    console.log(`📄 Average chunk size: ${Math.round(avgSize)} chars`);
    console.log(`📏 Largest chunk: ${maxSize} chars`);
    console.log(`📐 Smallest chunk: ${minSize} chars`);
    console.log(`📊 Size distribution:`);

    // Size distribution analysis
    const sizeRanges = [
      { min: 0, max: 200, label: 'Very Small' },
      { min: 201, max: 400, label: 'Small' },
      { min: 401, max: 600, label: 'Medium' },
      { min: 601, max: 800, label: 'Large' },
      { min: 801, max: Infinity, label: 'Very Large' },
    ];

    sizeRanges.forEach((range) => {
      const count = chunkSizes.filter(
        (size) => size >= range.min && size <= range.max
      ).length;
      const percentage = ((count / chunks.length) * 100).toFixed(1);
      console.log(
        `   ${range.label} (${range.min}-${
          range.max === Infinity ? '∞' : range.max
        }): ${count} chunks (${percentage}%)`
      );
    });

    // Show chunk previews
    console.log('\n🔍 CHUNK PREVIEW:');
    console.log('-'.repeat(30));

    // Show first 3 chunks
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(
        `\n📝 Chunk ${index + 1} (${chunk.pageContent.length} chars):`
      );
      const preview = chunk.pageContent
        .substring(0, 150)
        .replace(/\n/g, ' ')
        .trim();
      console.log(`"${preview}..."`);

      // Show metadata if available
      if (chunk.metadata && Object.keys(chunk.metadata).length > 0) {
        console.log(`🏷️  Metadata:`, JSON.stringify(chunk.metadata, null, 2));
      }
    });

    // Show overlap analysis for first few chunks
    console.log('\n🔄 OVERLAP ANALYSIS:');
    console.log('-'.repeat(30));
    for (let i = 0; i < Math.min(3, chunks.length - 1); i++) {
      const chunk1 = chunks[i].pageContent;
      const chunk2 = chunks[i + 1].pageContent;

      // Find actual overlap
      let overlapChars = 0;
      const minLength = Math.min(chunk1.length, chunk2.length);

      for (let j = 1; j <= minLength; j++) {
        const end1 = chunk1.substring(chunk1.length - j);
        const start2 = chunk2.substring(0, j);
        if (end1 === start2) {
          overlapChars = j;
        }
      }

      console.log(
        `Chunks ${i + 1}-${i + 2}: ${overlapChars} chars overlap (${(
          (overlapChars / Math.min(chunk1.length, chunk2.length)) *
          100
        ).toFixed(1)}%)`
      );
    }

    // Success summary
    console.log('\n🎉 STEP 2 COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(
      `📤 OUTPUT: ${chunks.length} document chunks ready for embedding`
    );
    console.log(
      `💾 Memory usage: ~${((totalChars * 2) / 1024 / 1024).toFixed(2)} MB`
    );
    console.log('➡️  Next step: Run embedding with "npm run step3-embedding"');
  } catch (error) {
    console.error('\n❌ STEP 2 FAILED:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('• Check if the PDF file is valid and readable');
    console.log('• Try smaller chunk sizes if memory issues occur');
    console.log('• Ensure chunk size is larger than overlap');
    process.exit(1);
  }
}

main().catch(console.error);
