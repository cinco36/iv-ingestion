# IV Ingestion JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for the IV Ingestion API - Home inspection data processing and management.

## Features

- ✅ **TypeScript Support** - Full type definitions and IntelliSense
- ✅ **Promise-based API** - Modern async/await support
- ✅ **Real-time Monitoring** - Event-driven processing status updates
- ✅ **Automatic Retry** - Built-in exponential backoff
- ✅ **Rate Limiting** - Automatic rate limit handling
- ✅ **File Upload** - Progress tracking and chunked uploads
- ✅ **Webhook Support** - Signature verification and event handling
- ✅ **Error Handling** - Comprehensive error types and messages
- ✅ **Request Interceptors** - Custom request/response handling
- ✅ **Batch Operations** - Bulk file upload and processing

## Installation

```bash
npm install @iv-ingestion/sdk
```

## Quick Start

```typescript
import { IVIngestionClient } from '@iv-ingestion/sdk';

// Initialize client
const client = new IVIngestionClient({
  baseURL: 'https://api.iv-ingestion.com/v1',
  apiKey: 'your-api-key'
});

// Upload a file
const result = await client.uploadFile({
  file: fileBuffer,
  metadata: { propertyId: '123' }
});

// Monitor processing
client.on('processing:progress', (progress) => {
  console.log(`Processing: ${progress.progress}%`);
});

// Get file status
const status = await client.getFileStatus(result.fileId);
```

## Configuration

```typescript
const client = new IVIngestionClient({
  baseURL: 'https://api.iv-ingestion.com/v1', // API base URL
  apiKey: 'your-api-key',                     // API key for authentication
  token: 'jwt-token',                         // JWT token (alternative to API key)
  timeout: 30000,                             // Request timeout in milliseconds
  maxRetries: 3,                              // Maximum retry attempts
  retryDelay: 1000,                           // Retry delay in milliseconds
  debug: false,                               // Enable debug logging
  headers: {                                  // Custom headers
    'User-Agent': 'MyApp/1.0.0'
  }
});
```

## Authentication

### API Key (Recommended for Server Applications)

```typescript
const client = new IVIngestionClient({
  apiKey: 'your-api-key'
});
```

### JWT Token (Recommended for Web Applications)

```typescript
// Login to get token
const loginResult = await client.login({
  email: 'user@example.com',
  password: 'password123'
});

// Token is automatically stored and used for subsequent requests
console.log('Logged in as:', loginResult.user.email);
```

### Dynamic Token Management

```typescript
// Set token after initialization
client.setToken('new-jwt-token');

// Set API key after initialization
client.setApiKey('new-api-key');
```

## File Upload

### Basic Upload

```typescript
import fs from 'fs';

const fileBuffer = fs.readFileSync('inspection.pdf');

const result = await client.uploadFile({
  file: fileBuffer,
  metadata: {
    propertyId: '123',
    inspectionType: 'residential',
    inspector: 'John Doe'
  }
});

console.log('File uploaded:', result.fileId);
```

### Upload with Progress Tracking

```typescript
const result = await client.uploadFile({
  file: fileBuffer,
  metadata: { propertyId: '123' }
}, (progress) => {
  console.log(`Upload: ${progress.percentage.toFixed(1)}%`);
  console.log(`Speed: ${(progress.speed / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`ETA: ${progress.estimatedTime.toFixed(0)}s`);
});
```

### Upload from Browser

```typescript
// In browser environment
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];

const result = await client.uploadFile({
  file: file,
  metadata: { propertyId: '123' }
});
```

## Real-time Processing Monitoring

### Event-based Monitoring

```typescript
// Listen for processing progress
client.on('processing:progress', (progress) => {
  console.log(`File ${progress.fileId}: ${progress.progress}%`);
  console.log(`Current step: ${progress.currentStep}`);
  console.log(`ETA: ${progress.estimatedTimeRemaining}s`);
});

// Listen for processing completion
client.on('processing:complete', (status) => {
  console.log(`Processing completed: ${status.fileId}`);
  console.log(`Findings: ${status.findings.length}`);
});

// Listen for processing errors
client.on('processing:error', (error) => {
  console.error(`Processing failed: ${error.fileId}`, error.error);
});

// Listen for processing timeout
client.on('processing:timeout', (data) => {
  console.warn(`Processing timeout: ${data.fileId}`);
});
```

### Manual Status Checking

```typescript
// Get current processing status
const status = await client.getFileStatus('file_12345');
console.log(`Status: ${status.status}, Progress: ${status.progress}%`);

// Get all active processing statuses
const allStatuses = client.getAllProcessingStatuses();
console.log(`Active processes: ${allStatuses.length}`);
```

## File Management

### Get File Status

```typescript
const status = await client.getFileStatus('file_12345');

console.log(`Filename: ${status.filename}`);
console.log(`Size: ${status.size} bytes`);
console.log(`Status: ${status.status}`);
console.log(`Progress: ${status.progress}%`);
console.log(`Findings: ${status.findings.length}`);

// Access findings
status.findings.forEach(finding => {
  console.log(`- ${finding.title} (${finding.severity})`);
});
```

### Download Processed File

```typescript
const fileBuffer = await client.downloadFile('file_12345');

// Save to file
fs.writeFileSync('processed-inspection.pdf', fileBuffer);
```

## Inspections

### List Inspections

```typescript
const inspections = await client.listInspections({
  page: 1,
  limit: 20,
  status: 'completed',
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31'
});

console.log(`Found ${inspections.inspections.length} inspections`);
console.log(`Total: ${inspections.pagination.total}`);

inspections.inspections.forEach(inspection => {
  console.log(`- ${inspection.id}: ${inspection.findingsCount} findings`);
});
```

### Get Inspection Details

```typescript
const inspection = await client.getInspection('insp_123');

console.log(`Property: ${inspection.property.address}`);
console.log(`Status: ${inspection.status}`);
console.log(`Findings: ${inspection.findings.length}`);

// Access property details
console.log(`Type: ${inspection.property.propertyType}`);
console.log(`Square footage: ${inspection.property.squareFootage}`);

// Access findings
inspection.findings.forEach(finding => {
  console.log(`- ${finding.title} (${finding.severity})`);
  console.log(`  Location: ${finding.location}`);
  console.log(`  Estimated cost: $${finding.estimatedCost}`);
});
```

## Webhooks

### Create Webhook

```typescript
const webhook = await client.createWebhook({
  url: 'https://myapp.com/webhooks/processing',
  events: ['processing.started', 'processing.completed', 'processing.failed'],
  description: 'Processing status updates'
});

console.log('Webhook created:', webhook.id);
```

### List Webhooks

```typescript
const webhooks = await client.listWebhooks();

webhooks.webhooks.forEach(webhook => {
  console.log(`- ${webhook.url} (${webhook.events.join(', ')})`);
  console.log(`  Active: ${webhook.isActive}`);
  console.log(`  Last triggered: ${webhook.lastTriggered}`);
});
```

### Delete Webhook

```typescript
await client.deleteWebhook('wh_12345');
console.log('Webhook deleted');
```

### Verify Webhook Signatures

```typescript
// In your webhook endpoint
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!client.verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  console.log('Webhook received:', req.body.event);
  res.status(200).send('OK');
});
```

## Batch Operations

### Batch File Upload

```typescript
const files = [
  { file: fileBuffer1, metadata: { propertyId: '123' } },
  { file: fileBuffer2, metadata: { propertyId: '124' } },
  { file: fileBuffer3, metadata: { propertyId: '125' } }
];

const results = await client.batchUpload({
  items: files,
  onProgress: (progress) => {
    console.log(`Batch progress: ${progress}%`);
  },
  onComplete: (results) => {
    console.log(`Batch completed: ${results.length} files`);
  },
  onError: (error) => {
    console.error('Batch error:', error);
  }
});
```

## Error Handling

### Try-Catch with Error Types

```typescript
try {
  const result = await client.uploadFile(fileData);
  console.log('Upload successful:', result.fileId);
} catch (error) {
  if (error instanceof IVIngestionError) {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        console.log('Rate limit exceeded, retry after:', error.details.retryAfter);
        break;
      case 'FILE_TOO_LARGE':
        console.log('File too large, max size:', error.details.maxSize);
        break;
      case 'INVALID_FILE_TYPE':
        console.log('Invalid file type, allowed:', error.details.allowedTypes);
        break;
      default:
        console.error('API error:', error.message);
    }
  } else {
    console.error('Network error:', error.message);
  }
}
```

### Request Interceptors

```typescript
// Add request interceptor
client.addRequestInterceptor((config) => {
  console.log(`Making request: ${config.method} ${config.url}`);
  return config;
});

// Add response interceptor
client.addResponseInterceptor((response) => {
  console.log(`Response: ${response.status} ${response.config.url}`);
  return response;
});

// Add error interceptor
client.addErrorInterceptor((error) => {
  console.error('Request failed:', error.message);
  // Return custom response or re-throw
  return null;
});
```

## Rate Limiting

### Get Rate Limit Info

```typescript
const rateLimitInfo = client.getRateLimitInfo();
if (rateLimitInfo) {
  console.log(`Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`);
  console.log(`Reset time: ${new Date(rateLimitInfo.reset)}`);
}
```

### Automatic Rate Limit Handling

The SDK automatically handles rate limiting by:

1. Including rate limit headers in requests
2. Respecting `Retry-After` headers
3. Implementing exponential backoff
4. Providing rate limit information in responses

## Health Check

```typescript
const health = await client.health();

console.log(`Status: ${health.status}`);
console.log(`Database: ${health.services.database}`);
console.log(`Redis: ${health.services.redis}`);
console.log(`Queue: ${health.services.queue}`);
```

## Admin Functions

### Get System Metrics

```typescript
const metrics = await client.getAdminMetrics();

console.log(`Files processed today: ${metrics.filesProcessed.today}`);
console.log(`Queue depth: ${metrics.queueDepth.current}`);
console.log(`Error rate: ${metrics.errorRate.current}%`);
console.log(`Active users: ${metrics.activeUsers.current}`);
```

### Get Queue Status

```typescript
const queues = await client.getQueueStatus();

queues.forEach(queue => {
  console.log(`Queue: ${queue.name}`);
  console.log(`  Waiting: ${queue.waiting}`);
  console.log(`  Active: ${queue.active}`);
  console.log(`  Completed: ${queue.completed}`);
  console.log(`  Failed: ${queue.failed}`);
  
  queue.workers.forEach(worker => {
    console.log(`  Worker ${worker.id}: ${worker.status}`);
  });
});
```

## TypeScript Support

The SDK provides comprehensive TypeScript support with full type definitions:

```typescript
import { 
  IVIngestionClient, 
  FileUploadResponse, 
  FileStatus, 
  Finding,
  Inspection,
  Webhook,
  IVIngestionError 
} from '@iv-ingestion/sdk';

// All types are fully typed
const result: FileUploadResponse = await client.uploadFile(fileData);
const status: FileStatus = await client.getFileStatus(result.fileId);
const findings: Finding[] = status.findings;
```

## Browser Support

The SDK works in both Node.js and browser environments:

### Node.js

```typescript
import { IVIngestionClient } from '@iv-ingestion/sdk';
import fs from 'fs';

const fileBuffer = fs.readFileSync('file.pdf');
const client = new IVIngestionClient({ apiKey: 'your-key' });
```

### Browser

```typescript
import { IVIngestionClient } from '@iv-ingestion/sdk';

const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const client = new IVIngestionClient({ apiKey: 'your-key' });
```

## Examples

### Complete File Processing Workflow

```typescript
import { IVIngestionClient } from '@iv-ingestion/sdk';

async function processInspectionFile(filePath: string, propertyId: string) {
  const client = new IVIngestionClient({
    apiKey: process.env.IV_INGESTION_API_KEY
  });

  try {
    // Upload file
    const fileBuffer = fs.readFileSync(filePath);
    const uploadResult = await client.uploadFile({
      file: fileBuffer,
      metadata: { propertyId }
    });

    console.log('File uploaded:', uploadResult.fileId);

    // Monitor processing
    return new Promise((resolve, reject) => {
      client.on('processing:progress', (progress) => {
        console.log(`Processing: ${progress.progress}%`);
      });

      client.on('processing:complete', async (status) => {
        try {
          // Get detailed inspection
          const inspection = await client.getInspection(status.inspectionId);
          
          console.log('Processing completed!');
          console.log(`Findings: ${inspection.findings.length}`);
          console.log(`Estimated cost: $${inspection.estimatedCost}`);
          
          resolve(inspection);
        } catch (error) {
          reject(error);
        }
      });

      client.on('processing:error', (error) => {
        reject(error.error);
      });
    });

  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// Usage
processInspectionFile('inspection.pdf', 'prop_123')
  .then(inspection => {
    console.log('Inspection processed successfully!');
  })
  .catch(error => {
    console.error('Processing failed:', error);
  });
```

### Webhook Integration

```typescript
import express from 'express';
import { IVIngestionClient } from '@iv-ingestion/sdk';

const app = express();
const client = new IVIngestionClient({ apiKey: process.env.API_KEY });

// Create webhook
app.post('/setup-webhook', async (req, res) => {
  try {
    const webhook = await client.createWebhook({
      url: 'https://myapp.com/webhooks/processing',
      events: ['processing.completed', 'processing.failed'],
      description: 'Processing notifications'
    });
    
    res.json({ success: true, webhookId: webhook.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
app.post('/webhooks/processing', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!client.verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'processing.completed':
      console.log('Processing completed:', data.fileId);
      // Handle completion
      break;
    case 'processing.failed':
      console.log('Processing failed:', data.fileId, data.error);
      // Handle failure
      break;
  }
  
  res.status(200).send('OK');
});
```

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Check your current tier limits
   - Implement exponential backoff
   - Consider upgrading your tier

2. **File Upload Failures**
   - Verify file size limits
   - Check supported file types
   - Ensure proper authentication

3. **Processing Timeouts**
   - Large files may take longer to process
   - Check system status
   - Contact support for persistent issues

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const client = new IVIngestionClient({
  apiKey: 'your-key',
  debug: true
});
```

### Support

- **Documentation**: https://docs.iv-ingestion.com/sdk/javascript
- **GitHub Issues**: https://github.com/iv-ingestion/sdk-javascript/issues
- **Support Email**: support@iv-ingestion.com

## License

MIT License - see [LICENSE](LICENSE) file for details. 