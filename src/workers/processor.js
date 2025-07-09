/**
 * IV Ingestion File Processing Worker
 * 
 * This worker processes uploaded files and extracts inspection data:
 * - Connects to Redis and initializes Bull queues
 * - Processes multiple file formats (PDF, Word, Excel, images)
 * - Extracts property info, inspector details, and findings
 * - Saves processed data to PostgreSQL with transactions
 * - Emits real-time status updates via Socket.IO
 * - Handles errors gracefully with retry logic
 * - Updates file status at each processing stage
 * - Implements graceful shutdown
 */

import Bull from 'bull';
import Redis from 'ioredis';
import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

// Import parsers
import pdfParser from '../services/parsers/pdfParser.js';
import wordParser from '../services/parsers/wordParser.js';
import excelParser from '../services/parsers/excelParser.js';
import ocrParser from '../services/parsers/ocrParser.js';

// Import database configuration
import knexfile from '../../knexfile.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/iv_ingestion';
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '../../uploads');
const MAX_RETRIES = 3;
const PROCESSING_TIMEOUT = 300000; // 5 minutes

// Initialize connections
const redis = new Redis(REDIS_URL, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

const db = knex(knexfile[NODE_ENV]);

// Initialize Bull queues
const fileProcessingQueue = new Bull('file-processing', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: MAX_RETRIES,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const dataExtractionQueue = new Bull('data-extraction', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: MAX_RETRIES,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Global Socket.IO instance (will be set by main app)
let globalIO = null;

/**
 * Set global Socket.IO instance
 */
export const setGlobalIO = (io) => {
  globalIO = io;
};

/**
 * Emit real-time status update
 */
const emitStatusUpdate = (event, data) => {
  if (globalIO) {
    globalIO.emit(event, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }
};

/**
 * Update file status in database
 */
const updateFileStatus = async (fileId, status, progress = null, error = null) => {
  try {
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (progress !== null) {
      updateData.progress = progress;
    }

    if (error !== null) {
      updateData.error = error;
    }

    await db('files')
      .where('id', fileId)
      .update(updateData);

    // Emit status update
    emitStatusUpdate('file-status-updated', {
      fileId,
      status,
      progress,
      error
    });

    console.log(`📁 File ${fileId} status updated to: ${status}`);
  } catch (error) {
    console.error(`❌ Failed to update file status for ${fileId}:`, error.message);
  }
};

/**
 * Extract property information from parsed content
 */
const extractPropertyInfo = (content) => {
  const propertyInfo = {
    address: null,
    city: null,
    state: null,
    zipCode: null,
    propertyType: null,
    squareFootage: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null
  };

  // Address extraction patterns
  const addressPatterns = [
    /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Circle|Cir))/gi,
    /(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Circle|Cir)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}[,\s]+\d{5})/gi
  ];

  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) {
      propertyInfo.address = match[0].trim();
      break;
    }
  }

  // City, State, ZIP extraction
  const cityStateZipPattern = /([A-Za-z\s]+)[,\s]+([A-Z]{2})[,\s]+(\d{5})/;
  const cityStateZipMatch = content.match(cityStateZipPattern);
  if (cityStateZipMatch) {
    propertyInfo.city = cityStateZipMatch[1].trim();
    propertyInfo.state = cityStateZipMatch[2];
    propertyInfo.zipCode = cityStateZipMatch[3];
  }

  // Property type extraction
  const propertyTypePatterns = [
    /(single\s+family|multi\s+family|condominium|townhouse|apartment|commercial|residential)/i,
    /(house|home|condo|apartment|building|structure)/i
  ];

  for (const pattern of propertyTypePatterns) {
    const match = content.match(pattern);
    if (match) {
      propertyInfo.propertyType = match[1].toLowerCase();
      break;
    }
  }

  // Square footage extraction
  const sqftPattern = /(\d{1,3}(?:,\d{3})*)\s*(?:sq\s*ft|square\s*feet|sf)/i;
  const sqftMatch = content.match(sqftPattern);
  if (sqftMatch) {
    propertyInfo.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''));
  }

  // Year built extraction
  const yearPattern = /(?:built|constructed|year)\s*(?:in\s*)?(\d{4})/i;
  const yearMatch = content.match(yearPattern);
  if (yearMatch) {
    propertyInfo.yearBuilt = parseInt(yearMatch[1]);
  }

  // Bedrooms and bathrooms extraction
  const bedroomPattern = /(\d+)\s*(?:bedroom|bed|br)/i;
  const bathroomPattern = /(\d+(?:\.\d+)?)\s*(?:bathroom|bath|ba)/i;

  const bedroomMatch = content.match(bedroomPattern);
  const bathroomMatch = content.match(bathroomPattern);

  if (bedroomMatch) {
    propertyInfo.bedrooms = parseInt(bedroomMatch[1]);
  }
  if (bathroomMatch) {
    propertyInfo.bathrooms = parseFloat(bathroomMatch[1]);
  }

  return propertyInfo;
};

/**
 * Extract inspector information from parsed content
 */
const extractInspectorInfo = (content) => {
  const inspectorInfo = {
    name: null,
    license: null,
    company: null,
    phone: null,
    email: null,
    inspectionDate: null
  };

  // Inspector name patterns
  const namePatterns = [
    /(?:inspector|inspected\s+by|performed\s+by)\s*:?\s*([A-Za-z\s]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*(?:inspector|inspected)/i
  ];

  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match) {
      inspectorInfo.name = match[1].trim();
      break;
    }
  }

  // License number patterns
  const licensePatterns = [
    /(?:license|lic\s*#|license\s*number)\s*:?\s*([A-Z0-9-]+)/i,
    /([A-Z]{2,3}\d{6,8})/i
  ];

  for (const pattern of licensePatterns) {
    const match = content.match(pattern);
    if (match) {
      inspectorInfo.license = match[1].trim();
      break;
    }
  }

  // Company name patterns
  const companyPatterns = [
    /(?:company|firm|agency)\s*:?\s*([A-Za-z\s&]+)/i,
    /([A-Z][a-z]+\s+(?:Inspections|Services|Company|Inc|LLC|Ltd))/i
  ];

  for (const pattern of companyPatterns) {
    const match = content.match(pattern);
    if (match) {
      inspectorInfo.company = match[1].trim();
      break;
    }
  }

  // Phone number patterns
  const phonePattern = /(?:phone|tel|telephone)\s*:?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i;
  const phoneMatch = content.match(phonePattern);
  if (phoneMatch) {
    inspectorInfo.phone = phoneMatch[1];
  }

  // Email patterns
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = content.match(emailPattern);
  if (emailMatch) {
    inspectorInfo.email = emailMatch[1];
  }

  // Inspection date patterns
  const datePatterns = [
    /(?:inspection\s+date|date\s+of\s+inspection|inspected\s+on)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      inspectorInfo.inspectionDate = moment(match[1], ['MM/DD/YYYY', 'MM-DD-YYYY', 'MM/DD/YY', 'MM-DD-YY']).toISOString();
      break;
    }
  }

  return inspectorInfo;
};

/**
 * Extract findings from parsed content
 */
const extractFindings = (content) => {
  const findings = [];
  
  // Finding patterns
  const findingPatterns = [
    /(?:finding|issue|problem|defect|deficiency)\s*:?\s*([^.\n]+)/gi,
    /(?:recommendation|recommend)\s*:?\s*([^.\n]+)/gi,
    /(?:repair|fix|replace)\s*:?\s*([^.\n]+)/gi
  ];

  for (const pattern of findingPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const finding = {
        id: uuidv4(),
        description: match[1].trim(),
        severity: 'medium', // Default severity
        category: 'general',
        recommendation: null,
        estimatedCost: null,
        priority: 'medium'
      };

      // Determine severity based on keywords
      const severityKeywords = {
        high: ['critical', 'urgent', 'safety', 'hazard', 'danger', 'emergency', 'immediate'],
        medium: ['moderate', 'attention', 'concern', 'issue', 'problem'],
        low: ['minor', 'cosmetic', 'maintenance', 'suggestion', 'recommendation']
      };

      for (const [severity, keywords] of Object.entries(severityKeywords)) {
        if (keywords.some(keyword => finding.description.toLowerCase().includes(keyword))) {
          finding.severity = severity;
          break;
        }
      }

      // Determine category based on keywords
      const categoryKeywords = {
        'electrical': ['electrical', 'wiring', 'outlet', 'circuit', 'breaker', 'panel'],
        'plumbing': ['plumbing', 'pipe', 'leak', 'drain', 'faucet', 'toilet'],
        'structural': ['structural', 'foundation', 'wall', 'roof', 'beam', 'support'],
        'hvac': ['hvac', 'heating', 'cooling', 'furnace', 'ac', 'air conditioning'],
        'roofing': ['roof', 'shingle', 'gutter', 'chimney', 'flashing'],
        'exterior': ['exterior', 'siding', 'window', 'door', 'deck', 'patio'],
        'interior': ['interior', 'floor', 'ceiling', 'paint', 'drywall']
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => finding.description.toLowerCase().includes(keyword))) {
          finding.category = category;
          break;
        }
      }

      findings.push(finding);
    }
  }

  return findings;
};

/**
 * Process file based on its type
 */
const processFile = async (filePath, fileType) => {
  console.log(`🔍 Processing ${fileType} file: ${filePath}`);

  let content = '';
  let extractedData = {};

  try {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        content = await pdfParser.parse(filePath);
        break;
      case 'docx':
      case 'doc':
        content = await wordParser.parse(filePath);
        break;
      case 'xlsx':
      case 'xls':
        const excelData = await excelParser.parse(filePath);
        content = excelData.text;
        extractedData = excelData.data;
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'tiff':
      case 'bmp':
        content = await ocrParser.parse(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Extract structured data
    const propertyInfo = extractPropertyInfo(content);
    const inspectorInfo = extractInspectorInfo(content);
    const findings = extractFindings(content);

    return {
      content,
      extractedData,
      propertyInfo,
      inspectorInfo,
      findings
    };
  } catch (error) {
    console.error(`❌ Error processing ${fileType} file:`, error.message);
    throw error;
  }
};

/**
 * Save processed data to database
 */
const saveProcessedData = async (fileId, userId, processedData) => {
  const trx = await db.transaction();

  try {
    const {
      propertyInfo,
      inspectorInfo,
      findings,
      content,
      extractedData
    } = processedData;

    // Save property information
    let propertyId = null;
    if (propertyInfo.address) {
      const [property] = await trx('properties').insert({
        address: propertyInfo.address,
        city: propertyInfo.city,
        state: propertyInfo.state,
        zipCode: propertyInfo.zipCode,
        propertyType: propertyInfo.propertyType,
        squareFootage: propertyInfo.squareFootage,
        yearBuilt: propertyInfo.yearBuilt,
        bedrooms: propertyInfo.bedrooms,
        bathrooms: propertyInfo.bathrooms,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning('id');
      
      propertyId = property.id;
    }

    // Save inspection record
    const [inspection] = await trx('inspections').insert({
      fileId,
      userId,
      propertyId,
      inspectorName: inspectorInfo.name,
      inspectorLicense: inspectorInfo.license,
      inspectorCompany: inspectorInfo.company,
      inspectorPhone: inspectorInfo.phone,
      inspectorEmail: inspectorInfo.email,
      inspectionDate: inspectorInfo.inspectionDate,
      status: 'completed',
      rawContent: content,
      extractedData: JSON.stringify(extractedData),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning('id');

    const inspectionId = inspection.id;

    // Save findings
    if (findings.length > 0) {
      const findingsToInsert = findings.map(finding => ({
        inspectionId,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
        recommendation: finding.recommendation,
        estimatedCost: finding.estimatedCost,
        priority: finding.priority,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await trx('findings').insert(findingsToInsert);
    }

    // Update file record
    await trx('files')
      .where('id', fileId)
      .update({
        status: 'processed',
        processedAt: new Date(),
        updatedAt: new Date()
      });

    await trx.commit();

    console.log(`✅ Data saved successfully for file ${fileId}`);
    
    return {
      inspectionId,
      propertyId,
      findingsCount: findings.length
    };
  } catch (error) {
    await trx.rollback();
    console.error(`❌ Failed to save processed data for file ${fileId}:`, error.message);
    throw error;
  }
};

/**
 * Process file job handler
 */
const processFileJob = async (job) => {
  const { fileId, userId, filePath, fileType, originalName } = job.data;
  
  console.log(`🚀 Starting file processing job for: ${originalName} (${fileId})`);
  
  try {
    // Update file status to processing
    await updateFileStatus(fileId, 'processing', 10);

    // Emit job started event
    emitStatusUpdate('file-processing-started', {
      fileId,
      fileName: originalName,
      fileType
    });

    // Process the file
    await updateFileStatus(fileId, 'processing', 30);
    const processedData = await processFile(filePath, fileType);
    
    await updateFileStatus(fileId, 'processing', 70);

    // Save processed data to database
    const saveResult = await saveProcessedData(fileId, userId, processedData);
    
    await updateFileStatus(fileId, 'processed', 100);

    // Emit processing completed event
    emitStatusUpdate('file-processing-completed', {
      fileId,
      fileName: originalName,
      inspectionId: saveResult.inspectionId,
      propertyId: saveResult.propertyId,
      findingsCount: saveResult.findingsCount
    });

    console.log(`✅ File processing completed successfully: ${originalName}`);
    
    return {
      success: true,
      fileId,
      inspectionId: saveResult.inspectionId,
      propertyId: saveResult.propertyId,
      findingsCount: saveResult.findingsCount
    };

  } catch (error) {
    console.error(`❌ File processing failed for ${originalName}:`, error.message);
    
    // Update file status to failed
    await updateFileStatus(fileId, 'failed', null, error.message);
    
    // Emit processing failed event
    emitStatusUpdate('file-processing-failed', {
      fileId,
      fileName: originalName,
      error: error.message
    });

    throw error;
  }
};

/**
 * Data extraction job handler
 */
const dataExtractionJob = async (job) => {
  const { inspectionId, content, extractionType } = job.data;
  
  console.log(`🔍 Starting data extraction job for inspection: ${inspectionId}`);
  
  try {
    // Perform additional data extraction based on type
    let extractedData = {};
    
    switch (extractionType) {
      case 'property_details':
        extractedData = extractPropertyInfo(content);
        break;
      case 'inspector_details':
        extractedData = extractInspectorInfo(content);
        break;
      case 'findings':
        extractedData = extractFindings(content);
        break;
      default:
        throw new Error(`Unknown extraction type: ${extractionType}`);
    }

    // Update inspection with extracted data
    await db('inspections')
      .where('id', inspectionId)
      .update({
        extractedData: JSON.stringify(extractedData),
        updatedAt: new Date()
      });

    console.log(`✅ Data extraction completed for inspection: ${inspectionId}`);
    
    return {
      success: true,
      inspectionId,
      extractedData
    };

  } catch (error) {
    console.error(`❌ Data extraction failed for inspection ${inspectionId}:`, error.message);
    throw error;
  }
};

/**
 * Initialize queues and start processing
 */
const initializeQueues = () => {
  // File processing queue
  fileProcessingQueue.process('process-file', processFileJob);
  
  fileProcessingQueue.on('completed', (job, result) => {
    console.log(`✅ File processing job completed: ${job.id}`);
    emitStatusUpdate('job-completed', {
      jobId: job.id,
      jobType: 'file-processing',
      result
    });
  });

  fileProcessingQueue.on('failed', (job, err) => {
    console.error(`❌ File processing job failed: ${job.id}`, err.message);
    emitStatusUpdate('job-failed', {
      jobId: job.id,
      jobType: 'file-processing',
      error: err.message
    });
  });

  // Data extraction queue
  dataExtractionQueue.process('extract-data', dataExtractionJob);
  
  dataExtractionQueue.on('completed', (job, result) => {
    console.log(`✅ Data extraction job completed: ${job.id}`);
    emitStatusUpdate('job-completed', {
      jobId: job.id,
      jobType: 'data-extraction',
      result
    });
  });

  dataExtractionQueue.on('failed', (job, err) => {
    console.error(`❌ Data extraction job failed: ${job.id}`, err.message);
    emitStatusUpdate('job-failed', {
      jobId: job.id,
      jobType: 'data-extraction',
      error: err.message
    });
  });

  console.log('🚀 File processing queues initialized');
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close all queues
    await Promise.all([
      fileProcessingQueue.close(),
      dataExtractionQueue.close()
    ]);
    
    // Close database connection
    await db.destroy();
    
    // Close Redis connection
    await redis.quit();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Start the worker
 */
const startWorker = async () => {
  try {
    console.log('🚀 Starting IV Ingestion File Processing Worker...');
    
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection established');
    
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection established');
    
    // Initialize queues
    initializeQueues();
    
    // Set up graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    console.log('🎯 Worker is ready to process files');
    console.log('📊 Monitoring queues: file-processing, data-extraction');
    
    // Emit worker started event
    emitStatusUpdate('worker-started', {
      workerId: process.pid,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
};

// Export functions for external use
export {
  fileProcessingQueue,
  dataExtractionQueue,
  processFileJob,
  dataExtractionJob,
  startWorker,
  gracefulShutdown
};

// Start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker();
} 