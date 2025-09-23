import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';

export async function loadPDF(filePath: string): Promise<Document[]> {
  console.log('\n📖 Step 1: Loading PDF file...');
  console.log(`📁 File path: ${filePath}`);

  try {
    const loader = new PDFLoader(filePath);
    const documents = await loader.load();

    console.log(`✅ PDF loaded successfully!`);
    console.log(`📄 Total pages: ${documents.length}`);

    // Log some metadata about the loaded documents
    documents.forEach((doc, index) => {
      console.log(`   Page ${index + 1}: ${doc.pageContent.length} characters`);
    });

    return documents;
  } catch (error) {
    console.error('❌ Error loading PDF:', error);
    throw error;
  }
}
