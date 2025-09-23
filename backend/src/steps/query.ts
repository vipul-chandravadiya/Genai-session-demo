import 'dotenv/config';
import { Document } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { initVectorStore } from './vectorStore';

export async function queryVectorDB(
  query: string,
  apiKey: string,
  embeddingModel: string = 'text-embedding-004',
  topK: number = 5
): Promise<[Document<Record<string, any>>, number][]> {
  const vectorStore = await initVectorStore();
  console.log(`\n🔍 Querying vector DB for: "${query}"`);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    model: embeddingModel,
  });

  const embedding = await embeddings.embedQuery(query);
  const results = await vectorStore.similaritySearchVectorWithScore(
    embedding,
    topK
  );

  return results;
}

export async function generateResponseWithChatModel(
  userQuery: string,
  vectorResults: [Document<Record<string, any>>, number][],
  apiKey: string,
  chatModel: string = 'gemini-1.5-flash',
  options?: { formatInstruction?: string }
): Promise<string> {
  // Prepare context from vector results
  const context = vectorResults
    .map(
      ([doc, score], idx) =>
        `Context #${idx + 1} (score: ${score.toFixed(
          4
        )}):\n${doc.pageContent.substring(0, 500)}${
          doc.pageContent.length > 500 ? '...' : ''
        }`
    )
    .join('\n\n');

  // Default instruction for the chat model
  const instruction =
    options?.formatInstruction ||
    `
    You are a friendly and helpful HR leave policy assistant. Your goal is to provide clear, well-structured, and user-friendly answers about leave policies using ONLY the provided context.

    RESPONSE FORMAT GUIDELINES:
    1. Start with a warm greeting when appropriate (e.g., "Here's what I found about your leave question:")
    2. Organize information using clear headings and bullet points for better readability
    3. Use natural, conversational language - avoid technical jargon or robotic phrasing
    4. Break complex information into digestible sections with descriptive headings
    5. Use bullet points (•) for lists to make information scannable
    6. End with a helpful closing statement when appropriate
    7. Avoid mentioning context numbers unless absolutely necessary for clarity
    8. If information is missing, say "I don't have that specific information in our current policy documents"

    EXAMPLE STRUCTURE:
    "Here's what I found about your query:

    **Leave Accrual:**
    • You can accrue up to 3 planned leaves per month
    • At year-end, you can cash in up to 6 accrued leaves based on your gross salary
    • Any unused balance will lapse after year-end

    **Application Timeline:**
    • Short leave (1+ days): Apply at least 2 calendar days in advance
    • Longer leave (3+ days): Apply 5 calendar days in advance  
    • Extended leave (5+ consecutive days): Apply 30 calendar days in advance

    **Important Notes:**
    • Maximum of 5 consecutive planned leave days per year
    • Cannot apply more than 90 days in advance

    Hope this helps clarify the leave policy! Feel free to ask if you need more details."

    TONE: Professional yet warm and conversational, like a helpful colleague explaining policies in person.
    
    Remember: Focus on clarity, organization, and being genuinely helpful to the user!
    `;

  // Build messages for the chat model
  const messages = [
    new SystemMessage(instruction),
    new HumanMessage(
      `User question: ${userQuery}\n\nvector database results:\n${context}`
    ),
  ];

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: chatModel,
    temperature: 0.2,
    maxOutputTokens: 512,
  });

  const response = await model.invoke(messages);
  return response.text;
}

export async function queryAndGenerate(
  query: string,
  apiKey: string,
  embeddingModel: string = 'text-embedding-004',
  chatModel: string = 'gemini-1.5-flash',
  topK: number = 3
): Promise<{
  results: [Document<Record<string, any>>, number][];
  answer: string;
}> {
  const results = await queryVectorDB(query, apiKey, embeddingModel, topK);
  const answer = await generateResponseWithChatModel(
    query,
    results,
    apiKey,
    chatModel
  );

  return {
    results,
    answer,
  };
}
