import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

export async function chunkDocuments(
  documents: Document[],
  chunkSize: number = 500,
  chunkOverlap: number = 75
): Promise<Document[]> {
  console.log('\n✂️  Step 2: Chunking documents...');

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  try {
    const chunks = await textSplitter.splitDocuments(documents);

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
