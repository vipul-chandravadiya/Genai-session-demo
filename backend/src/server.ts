import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import {
  processPDF,
  queryKnowledgeBase,
  PDFProcessingConfig,
} from './orchestrator';

const app = express();
const port = process.env.PORT || 3000;

// Configuration
const CONFIG = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'your-google-api-key-here',
  UPLOAD_DIR: './uploads',
  CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 75,
  EMBEDDING_MODEL: 'text-embedding-004',
  CHAT_MODEL: 'gemini-1.5-flash',
};

// Create uploads directory if it doesn't exist
if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}

// Create processing config
const processingConfig: PDFProcessingConfig = {
  apiKey: CONFIG.GOOGLE_API_KEY,
  chunkSize: CONFIG.CHUNK_SIZE,
  chunkOverlap: CONFIG.CHUNK_OVERLAP,
  embeddingModel: CONFIG.EMBEDDING_MODEL,
  chatModel: CONFIG.CHAT_MODEL,
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PDF Embedding Service',
  });
});

// PDF Upload and Processing endpoint
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded',
      });
    }

    console.log(`📁 Processing uploaded file: ${req.file.originalname}`);
    console.log(`📂 Saved as: ${req.file.filename}`);

    const filePath = path.join(CONFIG.UPLOAD_DIR, req.file.filename);

    // Process the PDF through the entire pipeline
    await processPDF(filePath, processingConfig);

    // Optionally clean up the uploaded file after processing
    // fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'PDF processed and stored in vector database successfully',
      filename: req.file.originalname,
      fileSize: req.file.size,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Query endpoint for chatting with the knowledge base
app.post('/query', async (req, res) => {
  try {
    const { query, topK = 3 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string',
      });
    }

    console.log(`🔍 Processing query: "${query}"`);

    // Query the vector database and generate response
    const result = await queryKnowledgeBase(query, processingConfig, topK);

    res.json({
      success: true,
      query,
      answer: result.answer,
      // sources: result.results.map(([doc, score], idx) => ({
      //   id: idx + 1,
      //   score: parseFloat(score.toFixed(4)),
      //   content:
      //     doc.pageContent.substring(0, 200) +
      //     (doc.pageContent.length > 200 ? '...' : ''),
      //   metadata: doc.metadata,
      // })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error processing query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get upload history (optional)
app.get('/uploads', (req, res) => {
  try {
    const files = fs
      .readdirSync(CONFIG.UPLOAD_DIR)
      .filter((file) => file.endsWith('.pdf'))
      .map((file) => {
        const filePath = path.join(CONFIG.UPLOAD_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          uploadedAt: stats.birthtime,
          size: stats.size,
        };
      })
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('❌ Error getting uploads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload history',
    });
  }
});

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        });
      }
    }

    console.error('💥 Unhandled error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 PDF Embedding Server running on port ${port}`);
  console.log(`📊 Configuration:`);
  console.log(`   - Upload directory: ${CONFIG.UPLOAD_DIR}`);
  console.log(`   - Max file size: 10MB`);
  console.log(`   - Chunk size: ${CONFIG.CHUNK_SIZE}`);
  console.log(`   - Chunk overlap: ${CONFIG.CHUNK_OVERLAP}`);
  console.log(`   - Embedding model: ${CONFIG.EMBEDDING_MODEL}`);
  console.log(`   - Chat model: ${CONFIG.CHAT_MODEL}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   - GET  /health - Health check`);
  console.log(`   - POST /upload-pdf - Upload and process PDF file`);
  console.log(`   - POST /query - Query the knowledge base`);
  console.log(`   - GET  /uploads - Get upload history`);

  // Validate environment
  if (
    !CONFIG.GOOGLE_API_KEY ||
    CONFIG.GOOGLE_API_KEY === 'your-google-api-key-here'
  ) {
    console.warn(
      '\n⚠️  WARNING: Please set your GOOGLE_API_KEY environment variable'
    );
  }
});

export default app;
