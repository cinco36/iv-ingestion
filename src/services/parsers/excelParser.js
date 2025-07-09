/**
 * Excel Parser Service
 * 
 * Extracts text content and structured data from Excel files (XLS and XLSX) using xlsx library.
 * Handles multiple sheets and provides both text and structured data output.
 */

import fs from 'fs/promises';
import XLSX from 'xlsx';

/**
 * Parse Excel file and extract text content
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<Object>} Extracted text and structured data
 */
const parse = async (filePath) => {
  try {
    console.log(`📊 Parsing Excel file: ${filePath}`);
    
    // Read the Excel file
    const buffer = await fs.readFile(filePath);
    
    // Parse the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Extract text from all sheets
    let allText = '';
    const structuredData = {};
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON for structured data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      structuredData[sheetName] = jsonData;
      
      // Convert sheet to text
      const textData = XLSX.utils.sheet_to_txt(worksheet);
      allText += `\n--- Sheet: ${sheetName} ---\n${textData}\n`;
    });
    
    console.log(`✅ Excel file parsed successfully. Extracted ${allText.length} characters from ${workbook.SheetNames.length} sheets`);
    
    return {
      text: allText,
      data: structuredData,
      metadata: {
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames,
        textLength: allText.length
      }
    };
  } catch (error) {
    console.error(`❌ Error parsing Excel file ${filePath}:`, error.message);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Parse specific sheet from Excel file
 * @param {string} filePath - Path to the Excel file
 * @param {string} sheetName - Name of the sheet to parse
 * @returns {Promise<Object>} Extracted data from specific sheet
 */
const parseSheet = async (filePath, sheetName) => {
  try {
    console.log(`📊 Parsing sheet "${sheetName}" from Excel file: ${filePath}`);
    
    // Read the Excel file
    const buffer = await fs.readFile(filePath);
    
    // Parse the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Check if sheet exists
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    
    // Get the specific worksheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Convert to text
    const textData = XLSX.utils.sheet_to_txt(worksheet);
    
    console.log(`✅ Sheet "${sheetName}" parsed successfully`);
    
    return {
      text: textData,
      data: jsonData,
      sheetName,
      metadata: {
        rowCount: jsonData.length,
        columnCount: jsonData.length > 0 ? jsonData[0].length : 0,
        textLength: textData.length
      }
    };
  } catch (error) {
    console.error(`❌ Error parsing sheet "${sheetName}" from Excel file ${filePath}:`, error.message);
    throw new Error(`Failed to parse Excel sheet: ${error.message}`);
  }
};

/**
 * Parse Excel file with custom options
 * @param {string} filePath - Path to the Excel file
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} Parsed data with custom options
 */
const parseWithOptions = async (filePath, options = {}) => {
  try {
    console.log(`📊 Parsing Excel file with options: ${filePath}`);
    
    // Read the Excel file
    const buffer = await fs.readFile(filePath);
    
    // Default options
    const defaultOptions = {
      cellText: false,
      cellDates: true,
      cellNF: false,
      cellStyles: false,
      ...options
    };
    
    // Parse the workbook with options
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      ...defaultOptions
    });
    
    // Extract data based on options
    let allText = '';
    const structuredData = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with options
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      });
      
      structuredData[sheetName] = jsonData;
      
      // Convert to text
      const textData = XLSX.utils.sheet_to_txt(worksheet);
      allText += `\n--- Sheet: ${sheetName} ---\n${textData}\n`;
    });
    
    console.log(`✅ Excel file parsed successfully with options`);
    
    return {
      text: allText,
      data: structuredData,
      options: defaultOptions,
      metadata: {
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames,
        textLength: allText.length
      }
    };
  } catch (error) {
    console.error(`❌ Error parsing Excel file ${filePath} with options:`, error.message);
    throw new Error(`Failed to parse Excel file with options: ${error.message}`);
  }
};

/**
 * Extract data as CSV from Excel file
 * @param {string} filePath - Path to the Excel file
 * @param {string} sheetName - Name of the sheet to convert (optional)
 * @returns {Promise<string>} CSV formatted data
 */
const extractAsCSV = async (filePath, sheetName = null) => {
  try {
    console.log(`📊 Extracting CSV from Excel file: ${filePath}`);
    
    // Read the Excel file
    const buffer = await fs.readFile(filePath);
    
    // Parse the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let csvData = '';
    
    if (sheetName) {
      // Convert specific sheet to CSV
      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }
      
      const worksheet = workbook.Sheets[sheetName];
      csvData = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      // Convert all sheets to CSV
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetCSV = XLSX.utils.sheet_to_csv(worksheet);
        csvData += `\n--- Sheet: ${sheetName} ---\n${sheetCSV}\n`;
      });
    }
    
    console.log(`✅ CSV extracted successfully from Excel file`);
    
    return csvData;
  } catch (error) {
    console.error(`❌ Error extracting CSV from Excel file ${filePath}:`, error.message);
    throw new Error(`Failed to extract CSV from Excel file: ${error.message}`);
  }
};

export default {
  parse,
  parseSheet,
  parseWithOptions,
  extractAsCSV
}; 