import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';

export async function createEmbedding(
  text: string,
  apiKey: string,
  model: string = 'text-embedding-004'
): Promise<number[]> {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    model,
  });

  try {
    const embedding = await embeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error('❌ Error creating embedding:', error);
    throw error;
  }
}

export async function createEmbeddings(
  chunks: Document[],
  apiKey: string,
  model: string = 'text-embedding-004'
): Promise<{ chunk: Document; embedding: number[] }[]> {
  console.log('\n🧠 Step 3: Creating embeddings...');
  console.log(`🔄 Processing ${chunks.length} chunks...`);

  try {
    const startTime = Date.now();
    const embeddings = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      console.log(`\n📊 Processing chunk ${i + 1}/${chunks.length}...`);
      console.log(
        `📝 Chunk content length: ${chunk.pageContent.length} characters`
      );

      // Create embedding for this chunk
      const embedding = await createEmbedding(chunk.pageContent, apiKey, model);

      embeddings.push({
        chunk,
        embedding,
      });

      // Add some delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
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

    return embeddings;
  } catch (error) {
    console.error('❌ Error creating embeddings:', error);
    throw error;
  }
}
