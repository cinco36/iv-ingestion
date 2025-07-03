/**
 * IV Ingestion SDK - Main Entry Point
 * 
 * Official JavaScript/TypeScript SDK for the IV Ingestion API
 * 
 * @example
 * ```typescript
 * import { IVIngestionClient } from '@iv-ingestion/sdk';
 * 
 * const client = new IVIngestionClient({
 *   baseURL: 'https://api.iv-ingestion.com/v1',
 *   apiKey: 'your-api-key'
 * });
 * 
 * // Upload a file
 * const result = await client.uploadFile({
 *   file: fileBuffer,
 *   metadata: { propertyId: '123' }
 * });
 * 
 * // Monitor processing
 * client.on('processing:progress', (progress) => {
 *   console.log(`Processing: ${progress.progress}%`);
 * });
 * ```
 */

// Export main client
export { IVIngestionClient } from './client';

// Export all types
export * from './types';

// Export version
export const VERSION = '1.0.0';

// Default export
import { IVIngestionClient } from './client';
export default IVIngestionClient; 