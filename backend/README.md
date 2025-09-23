# PDF Knowledge Base Server

A complete PDF processing and querying system with Express.js backend and web frontend.

## Features

- 📤 **PDF Upload**: Upload PDF files through a web interface
- 🧠 **Smart Processing**: Automatically extracts, chunks, and creates embeddings
- 💾 **Vector Storage**: Stores embeddings in Qdrant vector database
- 💬 **Chat Interface**: Query your knowledge base with natural language
- 🎯 **REST API**: Well-documented endpoints for integration

## Architecture

The application is organized into separate service modules:

```
src/
├── steps/
│   ├── pdfLoader.ts      # PDF loading service
│   ├── chunking.ts       # Document chunking service
│   ├── embedding.ts      # Embedding generation service
│   ├── vectorStore.ts    # Vector database operations
│   └── query.ts          # Query and response generation
├── orchestrator.ts       # Coordinates all processing steps
└── server.ts            # Express.js server with API endpoints
```

## Setup

### 1. Environment Variables

Create a `.env` file with:

```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Qdrant Vector Database

Make sure you have Qdrant running. Check `src/vectordb/index.ts` for connection configuration.

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run server:dev

# Production mode
npm run server
```

## API Endpoints

### Health Check

```http
GET /health
```

### Upload and Process PDF

```http
POST /upload-pdf
Content-Type: multipart/form-data

{
  "pdf": <file>
}
```

### Query Knowledge Base

```http
POST /query
Content-Type: application/json

{
  "query": "What is the leave policy?",
  "topK": 3
}
```

### Get Upload History

```http
GET /uploads
```

## Web Interface

Visit `http://localhost:3000` to access the web interface where you can:

1. **Upload PDFs**: Drag and drop or click to select PDF files
2. **Chat**: Ask questions about your uploaded documents
3. **View Sources**: See which parts of the document were used for answers

## Configuration

Edit the configuration in `src/server.ts`:

```typescript
const CONFIG = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  UPLOAD_DIR: './uploads',
  CHUNK_SIZE: 200,
  CHUNK_OVERLAP: 20,
  EMBEDDING_MODEL: 'models/text-embedding-004',
  CHAT_MODEL: 'gemini-1.5-flash',
};
```

## Individual Script Usage

You can still use the individual processing scripts:

```bash
# Process a specific PDF file
npm run process-pdf

# Query the vector database
npm run query-vector-db "your query here"
```

## File Structure

```
├── src/
│   ├── steps/              # Individual processing steps
│   ├── vectordb/           # Vector database configuration
│   ├── orchestrator.ts     # Main processing coordinator
│   └── server.ts          # Express server
├── public/
│   └── index.html         # Web frontend
├── uploads/               # PDF upload directory (auto-created)
└── package.json
```

## Error Handling

The server includes comprehensive error handling:

- File validation (PDF only, max 10MB)
- API error responses with details
- Graceful fallbacks for processing failures
- Request validation

## Security Considerations

- File type validation (PDF only)
- File size limits (10MB)
- CORS enabled for development
- Input sanitization for queries

## Troubleshooting

1. **Dependencies conflict**: Use `--legacy-peer-deps` flag when installing
2. **Vector DB connection**: Ensure Qdrant is running and accessible
3. **API Key**: Verify your Google API key is set correctly
4. **File uploads**: Check the uploads directory permissions

## Development

To extend the system:

1. **Add new processing steps**: Create new services in `src/steps/`
2. **Modify chunking**: Update `ChunkingService` configuration
3. **Change models**: Update embedding or chat models in configuration
4. **Add endpoints**: Extend `src/server.ts` with new routes
