# RAG Pipeline Step-by-Step Executables

This directory contains executable scripts for each step of the RAG (Retrieval-Augmented Generation) pipeline. Each script demonstrates the input/output and processing details for educational purposes.

## 📚 Available Scripts

### Individual Steps

| Step | Script                 | Description                   | Command                     |
| ---- | ---------------------- | ----------------------------- | --------------------------- |
| 1    | `step1-pdf-loader.ts`  | Load and parse PDF documents  | `npm run step1-pdf`         |
| 2    | `step2-chunking.ts`    | Split documents into chunks   | `npm run step2-chunking`    |
| 3    | `step3-embedding.ts`   | Create vector embeddings      | `npm run step3-embedding`   |
| 4    | `step4-vectorstore.ts` | Store embeddings in vector DB | `npm run step4-vectorstore` |
| 5    | `step5-query.ts`       | Query and generate responses  | `npm run step5-query`       |

### Complete Pipeline

| Script                 | Description               | Command            |
| ---------------------- | ------------------------- | ------------------ |
| `complete-pipeline.ts` | Run all steps in sequence | `npm run pipeline` |

## 🚀 Quick Start

### Prerequisites

1. **Google API Key**: Set your Google API key

   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   # or create .env file with GOOGLE_API_KEY=your_api_key_here
   ```

2. **Vector Database**: Start Qdrant (if not running)

   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

3. **PDF File**: Have a PDF file ready (default: `Ak-leave-policy.pdf`)

### Run Individual Steps

```bash
# Step 1: Load PDF
npm run step1-pdf -- "./your-document.pdf"

# Step 2: Chunk the document
npm run step2-chunking -- "./your-document.pdf" 500 75

# Step 3: Create embeddings (limited for demo)
npm run step3-embedding -- "./your-document.pdf" 500 75 5

# Step 4: Store in vector database
npm run step4-vectorstore -- "./your-document.pdf" 500 75 10

# Step 5: Query the system
npm run step5-query -- "What is the leave policy?"
```

### Run Complete Pipeline

```bash
# Process document and query in one go
npm run pipeline -- "./your-document.pdf" "What is the leave policy?"

# With custom parameters
npm run pipeline -- "./document.pdf" 1000 100 "How to apply for leave?"
```

## 📋 Script Details

### Step 1: PDF Loader (`step1-pdf-loader.ts`)

**Purpose**: Load and analyze PDF documents

**Input**:

- PDF file path
- File validation and metadata

**Output**:

- Document pages array
- Character statistics
- Content previews
- Processing metrics

**Example**:

```bash
npm run step1-pdf -- "./company-handbook.pdf"
```

**What it shows**:

- File size and modification date
- Number of pages extracted
- Character count per page
- Content preview of first few pages
- Processing time and performance metrics

### Step 2: Document Chunking (`step2-chunking.ts`)

**Purpose**: Split documents into manageable chunks for embedding

**Input**:

- PDF file path
- Chunk size (default: 500 chars)
- Overlap size (default: 75 chars)

**Output**:

- Array of document chunks
- Size distribution analysis
- Overlap analysis
- Chunk previews

**Example**:

```bash
npm run step2-chunking -- "./document.pdf" 1000 100
```

**What it shows**:

- Total chunks created
- Size statistics (min, max, average)
- Size distribution across ranges
- Actual overlap between consecutive chunks
- Sample chunk content

### Step 3: Embedding Creation (`step3-embedding.ts`)

**Purpose**: Create vector embeddings using Google's embedding model

**Input**:

- PDF file path
- Chunk parameters
- Max chunks to process (demo limit)

**Output**:

- Vector embeddings for each chunk
- Embedding statistics
- API usage metrics
- Similarity analysis

**Example**:

```bash
npm run step3-embedding -- "./document.pdf" 500 75 10
```

**What it shows**:

- Embedding dimensions and memory usage
- Processing time per embedding
- Vector statistics (magnitude, value ranges)
- Similarity scores between consecutive chunks
- API cost estimation

### Step 4: Vector Storage (`step4-vectorstore.ts`)

**Purpose**: Store embeddings in Qdrant vector database

**Input**:

- PDF file path
- Chunk parameters
- Max chunks to store

**Output**:

- Storage confirmation
- Database status
- Performance metrics

**Example**:

```bash
npm run step4-vectorstore -- "./document.pdf" 500 75 20
```

**What it shows**:

- Database connection status
- Number of documents stored
- Storage time and throughput
- Database readiness confirmation

### Step 5: Query & Generation (`step5-query.ts`)

**Purpose**: Query vector database and generate AI responses

**Input**:

- User query string
- Search parameters (topK, models)

**Output**:

- Similar documents found
- AI-generated response
- Quality metrics
- Performance analysis

**Example**:

```bash
npm run step5-query -- "What is the leave application process?"
```

**What it shows**:

- Similarity search results with scores
- Context utilization analysis
- AI response generation metrics
- Quality indicators and assessment
- API usage and cost estimation

### Complete Pipeline (`complete-pipeline.ts`)

**Purpose**: Execute all steps in sequence for end-to-end processing

**Input**:

- PDF file path
- Chunk parameters
- Query string

**Output**:

- Complete pipeline execution
- Step-by-step timing
- Final AI response
- Resource usage summary

**Example**:

```bash
npm run pipeline -- "./handbook.pdf" 750 100 "What are the vacation policies?"
```

**What it shows**:

- Complete data flow from PDF to response
- Timing breakdown for each step
- Resource utilization metrics
- End-to-end performance analysis

## 🔧 Configuration Options

### Environment Variables

```bash
# Required
GOOGLE_API_KEY=your_google_api_key

# Optional (for step5-query)
TOP_K=5                                    # Number of similar documents
EMBEDDING_MODEL=text-embedding-004         # Google embedding model
CHAT_MODEL=gemini-1.5-flash               # Google chat model
```

### Command Line Parameters

Most scripts accept these parameters in order:

1. PDF file path
2. Chunk size (characters)
3. Chunk overlap (characters)
4. Additional parameters (varies by script)

## 📊 Understanding the Output

### Performance Metrics

- **Processing Time**: How long each step takes
- **Throughput**: Items processed per second
- **Memory Usage**: Estimated memory consumption
- **API Costs**: Estimated costs for API calls

### Quality Indicators

- **Similarity Scores**: How relevant retrieved documents are
- **Context Utilization**: How well AI uses the provided context
- **Response Quality**: Structure, detail, and relevance assessment

### Debug Information

- **Content Previews**: Sample text from each processing stage
- **Statistics**: Counts, averages, and distributions
- **Metadata**: Additional information about processed items

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Issues**

   ```
   ❌ Please set your GOOGLE_API_KEY environment variable
   ```

   Solution: Set your Google API key in environment or .env file

2. **Vector Database Connection**

   ```
   ❌ Failed to connect to vector database
   ```

   Solution: Start Qdrant with `docker run -p 6333:6333 qdrant/qdrant`

3. **PDF File Not Found**

   ```
   ❌ PDF file not found!
   ```

   Solution: Check file path or use absolute path

4. **Rate Limiting**
   ```
   ❌ Error creating embeddings: Rate limit exceeded
   ```
   Solution: Reduce batch size or add delays

### Getting Help

```bash
# Get help for specific scripts
npm run pipeline -- --help
npm run step5-query -- --help

# List all available commands
npm run steps:help
```

## 📈 Performance Optimization

### For Large Documents

- Increase chunk size to reduce API calls
- Process in smaller batches for embeddings
- Use background processing for long operations

### For Better Accuracy

- Experiment with chunk sizes and overlap
- Adjust topK for more/fewer context documents
- Try different embedding models

### For Cost Optimization

- Limit chunk count during development
- Use smaller chunk sizes to reduce token usage
- Cache embeddings to avoid reprocessing

## 🎯 Educational Value

Each executable script is designed to:

1. **Show Clear Input/Output**: What goes in and what comes out
2. **Provide Detailed Metrics**: Performance, quality, and resource usage
3. **Explain Processing Steps**: What happens at each stage
4. **Enable Experimentation**: Easy parameter adjustment
5. **Facilitate Learning**: Understand RAG pipeline components

Use these scripts to understand how each component works, optimize parameters, and troubleshoot issues in your RAG implementation.
