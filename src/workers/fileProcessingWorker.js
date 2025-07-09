/**
 * File Processing Worker Startup Script
 * 
 * This script starts the file processing worker independently.
 * Can be run separately from the main application for scaling.
 */

import { startWorker } from './processor.js';

console.log('🚀 Starting IV Ingestion File Processing Worker...');

// Start the worker
startWorker().catch(error => {
  console.error('❌ Failed to start worker:', error);
  process.exit(1);
}); 