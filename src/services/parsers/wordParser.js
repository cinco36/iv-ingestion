/**
 * Word Document Parser Service
 * 
 * Extracts text content from Word documents (DOC and DOCX) using mammoth library.
 * Handles formatting and provides clean text output.
 */

import fs from 'fs/promises';
import mammoth from 'mammoth';

/**
 * Parse Word document and extract text content
 * @param {string} filePath - Path to the Word document
 * @returns {Promise<string>} Extracted text content
 */
const parse = async (filePath) => {
  try {
    console.log(`📝 Parsing Word document: ${filePath}`);
    
    // Read the Word document
    const buffer = await fs.readFile(filePath);
    
    // Parse the document
    const result = await mammoth.extractRawText({ buffer });
    
    // Extract text content
    const text = result.value;
    
    console.log(`✅ Word document parsed successfully. Extracted ${text.length} characters`);
    
    return text;
  } catch (error) {
    console.error(`❌ Error parsing Word document ${filePath}:`, error.message);
    throw new Error(`Failed to parse Word document: ${error.message}`);
  }
};

/**
 * Parse Word document with HTML output
 * @param {string} filePath - Path to the Word document
 * @returns {Promise<Object>} Parsed data with HTML and text
 */
const parseWithHtml = async (filePath) => {
  try {
    console.log(`📝 Parsing Word document with HTML: ${filePath}`);
    
    // Read the Word document
    const buffer = await fs.readFile(filePath);
    
    // Parse the document with HTML
    const result = await mammoth.convertToHtml({ buffer });
    
    console.log(`✅ Word document parsed successfully with HTML`);
    
    return {
      html: result.value,
      text: result.value.replace(/<[^>]*>/g, ''), // Strip HTML tags for text
      messages: result.messages
    };
  } catch (error) {
    console.error(`❌ Error parsing Word document ${filePath} with HTML:`, error.message);
    throw new Error(`Failed to parse Word document with HTML: ${error.message}`);
  }
};

/**
 * Parse Word document with custom options
 * @param {string} filePath - Path to the Word document
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} Parsed data with text and metadata
 */
const parseWithOptions = async (filePath, options = {}) => {
  try {
    console.log(`📝 Parsing Word document with options: ${filePath}`);
    
    // Read the Word document
    const buffer = await fs.readFile(filePath);
    
    // Default options
    const defaultOptions = {
      ignoreEmptyParagraphs: true,
      ignoreFootnotes: false,
      ignoreEndnotes: false,
      ignoreHeaders: false,
      ignoreFooters: false,
      ...options
    };
    
    // Parse the document with options
    const result = await mammoth.extractRawText({ 
      buffer,
      ...defaultOptions
    });
    
    console.log(`✅ Word document parsed successfully with options`);
    
    return {
      text: result.value,
      messages: result.messages,
      metadata: {
        textLength: result.value.length,
        hasMessages: result.messages.length > 0
      }
    };
  } catch (error) {
    console.error(`❌ Error parsing Word document ${filePath} with options:`, error.message);
    throw new Error(`Failed to parse Word document with options: ${error.message}`);
  }
};

/**
 * Extract images from Word document
 * @param {string} filePath - Path to the Word document
 * @returns {Promise<Array>} Array of extracted images
 */
const extractImages = async (filePath) => {
  try {
    console.log(`📝 Extracting images from Word document: ${filePath}`);
    
    // Read the Word document
    const buffer = await fs.readFile(filePath);
    
    // Extract images
    const result = await mammoth.extractRawText({ 
      buffer,
      convertImage: mammoth.images.imgElement
    });
    
    console.log(`✅ Images extracted from Word document`);
    
    return {
      text: result.value,
      images: result.messages.filter(msg => msg.type === 'image')
    };
  } catch (error) {
    console.error(`❌ Error extracting images from Word document ${filePath}:`, error.message);
    throw new Error(`Failed to extract images from Word document: ${error.message}`);
  }
};

export default {
  parse,
  parseWithHtml,
  parseWithOptions,
  extractImages
}; 