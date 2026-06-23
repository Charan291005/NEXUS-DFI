import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extracts raw text from various file formats (PDF, DOCX, Images, Text)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    // 1. Text / JSON / CSV / Logs
    if (
      fileType.startsWith('text/') ||
      fileType === 'application/json' ||
      fileName.endsWith('.log') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.md')
    ) {
      return await file.text();
    }

    // 2. PDF extraction
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      return fullText || 'No readable text found in PDF.';
    }

    // 3. DOCX extraction
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || 'No readable text found in document.';
    }

    // 4. Image OCR (PNG, JPG, JPEG)
    if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png)$/)) {
      // Use Tesseract to perform local OCR
      const result = await Tesseract.recognize(file, 'eng');
      return result.data.text || 'No readable text detected in the image.';
    }

    return `[Unsupported file format: ${fileName}]`;
  } catch (error) {
    console.error(`Error parsing file ${fileName}:`, error);
    return `[Error extracting text from ${fileName}]`;
  }
}
