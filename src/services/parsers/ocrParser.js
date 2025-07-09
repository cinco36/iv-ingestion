/**
 * OCR Parser Service
 * 
 * Extracts text content from images using Tesseract.js OCR library.
 * Supports various image formats and provides text extraction with confidence scores.
 */

import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Parse image and extract text using OCR
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} Extracted text content
 */
const parse = async (filePath) => {
  try {
    console.log(`🖼️  Parsing image with OCR: ${filePath}`);
    
    // Read the image file
    const imageBuffer = await fs.readFile(filePath);
    
    // Perform OCR
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`🔄 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Extract text content
    const text = result.data.text;
    
    console.log(`✅ OCR completed successfully. Extracted ${text.length} characters with ${Math.round(result.data.confidence)}% confidence`);
    
    return text;
  } catch (error) {
    console.error(`❌ Error parsing image with OCR ${filePath}:`, error.message);
    throw new Error(`Failed to parse image with OCR: ${error.message}`);
  }
};

/**
 * Parse image with custom OCR options
 * @param {string} filePath - Path to the image file
 * @param {Object} options - OCR options
 * @returns {Promise<Object>} Extracted text and metadata
 */
const parseWithOptions = async (filePath, options = {}) => {
  try {
    console.log(`🖼️  Parsing image with OCR options: ${filePath}`);
    
    // Read the image file
    const imageBuffer = await fs.readFile(filePath);
    
    // Default options
    const defaultOptions = {
      lang: 'eng',
      oem: 3, // OCR Engine Mode: Default
      psm: 3, // Page Segmentation Mode: Fully automatic page segmentation
      ...options
    };
    
    // Perform OCR with options
    const result = await Tesseract.recognize(imageBuffer, defaultOptions.lang, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`🔄 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      oem: defaultOptions.oem,
      psm: defaultOptions.psm
    });
    
    console.log(`✅ OCR completed successfully with options`);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
      lines: result.data.lines,
      paragraphs: result.data.paragraphs,
      blocks: result.data.blocks,
      options: defaultOptions
    };
  } catch (error) {
    console.error(`❌ Error parsing image with OCR options ${filePath}:`, error.message);
    throw new Error(`Failed to parse image with OCR options: ${error.message}`);
  }
};

/**
 * Preprocess image before OCR for better results
 * @param {string} filePath - Path to the image file
 * @param {Object} preprocessingOptions - Image preprocessing options
 * @returns {Promise<string>} Extracted text from preprocessed image
 */
const parseWithPreprocessing = async (filePath, preprocessingOptions = {}) => {
  try {
    console.log(`🖼️  Parsing image with preprocessing: ${filePath}`);
    
    // Read the image file
    const imageBuffer = await fs.readFile(filePath);
    
    // Default preprocessing options
    const defaultPreprocessing = {
      grayscale: true,
      contrast: 1.2,
      brightness: 1.1,
      sharpen: true,
      denoise: true,
      ...preprocessingOptions
    };
    
    // Preprocess image
    let processedImage = sharp(imageBuffer);
    
    if (defaultPreprocessing.grayscale) {
      processedImage = processedImage.grayscale();
    }
    
    if (defaultPreprocessing.contrast !== 1) {
      processedImage = processedImage.linear(defaultPreprocessing.contrast, 0);
    }
    
    if (defaultPreprocessing.brightness !== 1) {
      processedImage = processedImage.modulate({
        brightness: defaultPreprocessing.brightness
      });
    }
    
    if (defaultPreprocessing.sharpen) {
      processedImage = processedImage.sharpen();
    }
    
    if (defaultPreprocessing.denoise) {
      processedImage = processedImage.median(1);
    }
    
    // Convert to buffer
    const processedBuffer = await processedImage.toBuffer();
    
    // Perform OCR on preprocessed image
    const result = await Tesseract.recognize(processedBuffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`🔄 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log(`✅ OCR with preprocessing completed successfully`);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      preprocessing: defaultPreprocessing
    };
  } catch (error) {
    console.error(`❌ Error parsing image with preprocessing ${filePath}:`, error.message);
    throw new Error(`Failed to parse image with preprocessing: ${error.message}`);
  }
};

/**
 * Extract text from specific regions of an image
 * @param {string} filePath - Path to the image file
 * @param {Array} regions - Array of regions to extract text from
 * @returns {Promise<Object>} Extracted text from each region
 */
const parseRegions = async (filePath, regions) => {
  try {
    console.log(`🖼️  Parsing specific regions from image: ${filePath}`);
    
    // Read the image file
    const imageBuffer = await fs.readFile(filePath);
    
    const results = {};
    
    // Process each region
    for (const region of regions) {
      const { name, x, y, width, height } = region;
      
      // Extract region from image
      const regionBuffer = await sharp(imageBuffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer();
      
      // Perform OCR on region
      const result = await Tesseract.recognize(regionBuffer, 'eng');
      
      results[name] = {
        text: result.data.text,
        confidence: result.data.confidence,
        region: { x, y, width, height }
      };
    }
    
    console.log(`✅ Region-based OCR completed successfully`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error parsing regions from image ${filePath}:`, error.message);
    throw new Error(`Failed to parse regions from image: ${error.message}`);
  }
};

/**
 * Get available OCR languages
 * @returns {Promise<Array>} Array of available language codes
 */
const getAvailableLanguages = async () => {
  try {
    const languages = await Tesseract.getLanguages();
    return languages;
  } catch (error) {
    console.error('❌ Error getting available languages:', error.message);
    return ['eng']; // Default to English
  }
};

export default {
  parse,
  parseWithOptions,
  parseWithPreprocessing,
  parseRegions,
  getAvailableLanguages
}; 