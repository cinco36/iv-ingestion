/**
 * PDF Parser Service
 * 
 * Extracts text content from PDF files using pdf-parse library.
 * Handles various PDF formats and provides structured text output.
 */

import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

/**
 * Parse PDF file and extract text content
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
const parse = async (filePath) => {
  try {
    console.log(`📄 Parsing PDF file: ${filePath}`);
    
    // Read the PDF file
    const dataBuffer = await fs.readFile(filePath);
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    
    // Extract text content
    const text = data.text;
    
    console.log(`✅ PDF parsed successfully. Extracted ${text.length} characters`);
    
    return text;
  } catch (error) {
    console.error(`❌ Error parsing PDF file ${filePath}:`, error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

/**
 * Parse PDF file with options
 * @param {string} filePath - Path to the PDF file
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} Parsed data with text and metadata
 */
const parseWithOptions = async (filePath, options = {}) => {
  try {
    console.log(`📄 Parsing PDF file with options: ${filePath}`);
    
    // Read the PDF file
    const dataBuffer = await fs.readFile(filePath);
    
    // Parse the PDF with options
    const data = await pdfParse(dataBuffer, options);
    
    console.log(`✅ PDF parsed successfully with options`);
    
    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info,
        version: data.version,
        textLength: data.text.length
      }
    };
  } catch (error) {
    console.error(`❌ Error parsing PDF file ${filePath} with options:`, error.message);
    throw new Error(`Failed to parse PDF with options: ${error.message}`);
  }
};

/**
 * Extract text from specific pages
 * @param {string} filePath - Path to the PDF file
 * @param {Array<number>} pageNumbers - Array of page numbers to extract (1-based)
 * @returns {Promise<string>} Extracted text from specified pages
 */
const extractPages = async (filePath, pageNumbers) => {
  try {
    console.log(`📄 Extracting pages ${pageNumbers.join(', ')} from PDF: ${filePath}`);
    
    // Read the PDF file
    const dataBuffer = await fs.readFile(filePath);
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    
    // Split text into pages (approximate)
    const pages = data.text.split('\n\n');
    
    // Extract specified pages
    const extractedPages = pageNumbers
      .filter(pageNum => pageNum > 0 && pageNum <= pages.length)
      .map(pageNum => pages[pageNum - 1])
      .join('\n\n');
    
    console.log(`✅ Extracted ${pageNumbers.length} pages from PDF`);
    
    return extractedPages;
  } catch (error) {
    console.error(`❌ Error extracting pages from PDF ${filePath}:`, error.message);
    throw new Error(`Failed to extract pages from PDF: ${error.message}`);
  }
};

export default {
  parse,
  parseWithOptions,
  extractPages
}; 